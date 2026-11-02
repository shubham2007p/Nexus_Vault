import crypto from 'crypto';
import { dbAll, dbGet, dbRun, withTransaction } from './db.js';

/**
 * Safeguard 2: Single-User Development Mode Isolation vs. Real Authentication.
 * 'default_user' is strictly a local development workspace scope, NOT an authentication mechanism.
 */
export const DEV_WORKSPACE_USER_ID = 'default_user';
const USER_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

export class HttpError extends Error {
  constructor(status, message, code = 'ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * Resolves and validates the active user scope for a request.
 * Enforces strict format validation and isolates single-user dev mode.
 */
export function resolveUserContext(req) {
  if (req?.user?.id) {
    return {
      userId: req.user.id,
      user: req.user,
      isDevSingleUserMode: req.user.id === DEV_WORKSPACE_USER_ID,
    };
  }

  const requireStrictAuth = process.env.CHATTYFI_REQUIRE_AUTH === 'true';
  const rawHeaderUser = req?.headers?.['x-user-id'];

  if (requireStrictAuth && (!rawHeaderUser || rawHeaderUser.trim() === '' || rawHeaderUser.trim() === DEV_WORKSPACE_USER_ID)) {
    throw new HttpError(
      401,
      'Authentication is required. Single-user development mode is disabled.',
      'AUTH_REQUIRED'
    );
  }

  if (rawHeaderUser !== undefined && rawHeaderUser !== null && String(rawHeaderUser).trim() !== '') {
    const candidate = String(rawHeaderUser).trim();
    if (!USER_ID_PATTERN.test(candidate)) {
      throw new HttpError(
        400,
        'Invalid x-user-id format. Must be 1-64 alphanumeric, underscore, or hyphen characters.',
        'INVALID_USER_ID'
      );
    }
    return {
      userId: candidate,
      isDevSingleUserMode: candidate === DEV_WORKSPACE_USER_ID,
    };
  }

  return {
    userId: DEV_WORKSPACE_USER_ID,
    isDevSingleUserMode: true,
  };
}

/**
 * Safeguard 4: Three Confidence Zones for Topic Matching.
 * Prevents blind merging or blind topic creation based on a single threshold.
 */
export const TOPIC_CONFIDENCE_THRESHOLDS = {
  HIGH: 0.78,
  AMBIGUOUS_MIN: 0.45,
};

export function classifyTopicMatchConfidence(confidenceScore) {
  const num = Number(confidenceScore);
  const clamped = Number.isFinite(num) ? Math.max(0, Math.min(1, num)) : 0;

  if (clamped >= TOPIC_CONFIDENCE_THRESHOLDS.HIGH) {
    return {
      confidence: clamped,
      zone: 'high_confidence',
      confirmationStatus: 'confirmed',
      recommendedAction: 'consolidate_existing_topic',
    };
  }

  if (clamped >= TOPIC_CONFIDENCE_THRESHOLDS.AMBIGUOUS_MIN) {
    return {
      confidence: clamped,
      zone: 'ambiguous',
      confirmationStatus: 'pending_review',
      recommendedAction: 'caution_suggest_relationship_or_confirm',
    };
  }

  return {
    confidence: clamped,
    zone: 'low_confidence',
    confirmationStatus: 'confirmed',
    recommendedAction: 'create_distinct_new_topic',
  };
}

/**
 * Safeguard 5: Ensure interrupted, streaming, or failed AI responses
 * can NEVER be marked or processed as complete knowledge.
 */
export function validateAndResolveMessageStatuses({
  generationStatus = 'completed',
  processingStatus = 'pending',
  content = '',
}) {
  const validGenStatuses = new Set(['streaming', 'completed', 'interrupted', 'failed']);
  const validProcStatuses = new Set([
    'pending',
    'processing',
    'completed',
    'skipped',
    'failed',
    'blocked_incomplete',
  ]);

  if (!validGenStatuses.has(generationStatus)) {
    throw new HttpError(400, `Invalid generation_status: "${generationStatus}"`, 'INVALID_GENERATION_STATUS');
  }

  if (!validProcStatuses.has(processingStatus)) {
    throw new HttpError(400, `Invalid processing_status: "${processingStatus}"`, 'INVALID_PROCESSING_STATUS');
  }

  const trimmedContent = typeof content === 'string' ? content.trim() : '';
  const isGenerationComplete = generationStatus === 'completed' && trimmedContent.length > 0;

  // Explicit guard: cannot transition to 'processing' or 'completed' if generation is incomplete or empty
  if (!isGenerationComplete && (processingStatus === 'processing' || processingStatus === 'completed')) {
    throw new HttpError(
      400,
      `Cannot mark message knowledge as "${processingStatus}" when generation_status is "${generationStatus}" or content is empty.`,
      'INCOMPLETE_MESSAGE_KNOWLEDGE_BLOCKED'
    );
  }

  // Automatically lock processing_status to 'blocked_incomplete' if generation was interrupted or failed
  let resolvedProcessingStatus = processingStatus;
  if (generationStatus === 'interrupted' || generationStatus === 'failed') {
    resolvedProcessingStatus = 'blocked_incomplete';
  } else if (generationStatus === 'streaming' && resolvedProcessingStatus !== 'skipped') {
    resolvedProcessingStatus = 'pending';
  }

  return {
    generationStatus,
    processingStatus: resolvedProcessingStatus,
    canProcessKnowledge: isGenerationComplete && resolvedProcessingStatus !== 'blocked_incomplete',
  };
}

function generateId(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`;
}

function safeParseJson(str, fallback) {
  if (!str || typeof str !== 'string') return fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

export function normalizeTopicName(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatMessageRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    conversation_id: row.conversation_id,
    user_id: row.user_id,
    role: row.role,
    content: row.content,
    attachment_ids: safeParseJson(row.attachment_ids, []),
    topic_id: row.topic_id || null,
    generation_status: row.generation_status,
    processing_status: row.processing_status,
    processing_metadata: safeParseJson(row.processing_metadata, {}),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Verify conversation exists and belongs to the requesting userId.
 */
export async function assertConversationOwnership(userId, conversationId) {
  if (!conversationId) {
    throw new HttpError(400, 'Conversation ID is required', 'MISSING_CONVERSATION_ID');
  }
  const conv = await dbGet(
    `SELECT * FROM conversations WHERE id = ? AND user_id = ?`,
    [conversationId, userId]
  );
  if (!conv) {
    throw new HttpError(404, 'Conversation not found', 'CONVERSATION_NOT_FOUND');
  }
  return conv;
}

/**
 * 1. List Conversations for a User (with search & topic summaries)
 */
export async function listConversations(
  userId,
  { search = '', includeArchived = false, limit = 50, offset = 0 } = {}
) {
  const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 50), 200);
  const safeOffset = Math.max(0, parseInt(offset, 10) || 0);
  const q = typeof search === 'string' ? search.trim().toLowerCase() : '';

  let sql = `
    SELECT c.*,
           (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.user_id = c.user_id) as message_count,
           (SELECT m2.content FROM messages m2 WHERE m2.conversation_id = c.id AND m2.user_id = c.user_id ORDER BY m2.created_at DESC LIMIT 1) as last_message_preview
    FROM conversations c
    WHERE c.user_id = ?
  `;
  const params = [userId];

  if (!includeArchived) {
    sql += ` AND c.is_archived = 0`;
  }

  if (q) {
    sql += ` AND (
      LOWER(c.title) LIKE ?
      OR EXISTS (
        SELECT 1 FROM messages m
        WHERE m.conversation_id = c.id AND m.user_id = c.user_id AND LOWER(m.content) LIKE ?
      )
      OR EXISTS (
        SELECT 1 FROM conversation_topics ct
        JOIN topics t ON ct.topic_id = t.id
        WHERE ct.conversation_id = c.id AND ct.user_id = c.user_id AND LOWER(t.name) LIKE ?
      )
    )`;
    const likePattern = `%${q}%`;
    params.push(likePattern, likePattern, likePattern);
  }

  sql += ` ORDER BY c.updated_at DESC LIMIT ? OFFSET ?`;
  params.push(safeLimit, safeOffset);

  const conversations = await dbAll(sql, params);

  // Attach associated topics for each conversation
  if (conversations.length > 0) {
    const convIds = conversations.map((c) => c.id);
    const placeholders = convIds.map(() => '?').join(',');
    const topicRows = await dbAll(
      `SELECT ct.conversation_id, ct.topic_id, ct.match_confidence, ct.match_zone, ct.confirmation_status,
              t.name as topic_name, t.raw_file_id, t.processed_file_id
       FROM conversation_topics ct
       JOIN topics t ON ct.topic_id = t.id
       WHERE ct.user_id = ? AND ct.conversation_id IN (${placeholders})
       ORDER BY ct.updated_at DESC`,
      [userId, ...convIds]
    );

    const topicsByConv = new Map();
    for (const r of topicRows) {
      if (!topicsByConv.has(r.conversation_id)) {
        topicsByConv.set(r.conversation_id, []);
      }
      topicsByConv.get(r.conversation_id).push({
        id: r.topic_id,
        name: r.topic_name,
        match_confidence: r.match_confidence,
        match_zone: r.match_zone,
        confirmation_status: r.confirmation_status,
        raw_file_id: r.raw_file_id,
        processed_file_id: r.processed_file_id,
      });
    }

    return conversations.map((c) => ({
      ...c,
      is_archived: Boolean(c.is_archived),
      topics: topicsByConv.get(c.id) || [],
    }));
  }

  return [];
}

/**
 * 2. Create a New Conversation
 */
export async function createConversation(userId, { title = 'New Conversation', activeTopicId = null } = {}) {
  const cleanTitle = (typeof title === 'string' && title.trim() ? title.trim() : 'New Conversation').slice(0, 200);
  const id = generateId('conv');
  const now = new Date().toISOString();

  return withTransaction(async () => {
    let validTopicId = null;
    if (activeTopicId !== null && activeTopicId !== undefined) {
      const topic = await dbGet(`SELECT id FROM topics WHERE id = ? AND user_id = ?`, [activeTopicId, userId]);
      if (!topic) {
        throw new HttpError(404, 'Referenced active topic not found for this user', 'TOPIC_NOT_FOUND');
      }
      validTopicId = topic.id;
    }

    await dbRun(
      `INSERT INTO conversations (id, user_id, title, active_topic_id, is_archived, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
      [id, userId, cleanTitle, validTopicId, now, now]
    );

    const created = await dbGet(`SELECT * FROM conversations WHERE id = ? AND user_id = ?`, [id, userId]);
    return {
      ...created,
      is_archived: Boolean(created.is_archived),
      message_count: 0,
      messages: [],
      topics: [],
    };
  });
}

/**
 * 3. Get Single Conversation with Messages, Topics, and Attachments
 */
export async function getConversationById(userId, conversationId) {
  const conv = await assertConversationOwnership(userId, conversationId);

  const [messageRows, topicRows, attachmentRows] = await Promise.all([
    dbAll(
      `SELECT * FROM messages WHERE conversation_id = ? AND user_id = ? ORDER BY created_at ASC, rowid ASC`,
      [conversationId, userId]
    ),
    dbAll(
      `SELECT ct.*, t.name as topic_name, t.normalized_name, t.summary, t.keywords,
              t.raw_file_id, t.processed_file_id,
              rf.title as raw_file_title, pf.title as processed_file_title
       FROM conversation_topics ct
       JOIN topics t ON ct.topic_id = t.id
       LEFT JOIN files rf ON t.raw_file_id = rf.id
       LEFT JOIN files pf ON t.processed_file_id = pf.id
       WHERE ct.conversation_id = ? AND ct.user_id = ?
       ORDER BY ct.updated_at DESC`,
      [conversationId, userId]
    ),
    dbAll(
      `SELECT id, conversation_id, message_id, original_name, mime_type, size_bytes,
              attachment_type, extraction_status, extraction_note, created_at
       FROM attachments
       WHERE conversation_id = ? AND user_id = ?
       ORDER BY created_at ASC`,
      [conversationId, userId]
    ),
  ]);

  const attachmentsById = new Map(attachmentRows.map((a) => [a.id, a]));
  const formattedMessages = messageRows.map((m) => {
    const formatted = formatMessageRow(m);
    formatted.attachments = formatted.attachment_ids
      .map((aId) => attachmentsById.get(aId))
      .filter(Boolean);
    return formatted;
  });

  const formattedTopics = topicRows.map((t) => ({
    id: t.topic_id,
    name: t.topic_name,
    normalized_name: t.normalized_name,
    summary: t.summary,
    keywords: safeParseJson(t.keywords, []),
    raw_file_id: t.raw_file_id,
    raw_file_title: t.raw_file_title || null,
    processed_file_id: t.processed_file_id,
    processed_file_title: t.processed_file_title || null,
    message_count: t.message_count,
    match_confidence: t.match_confidence,
    match_zone: t.match_zone,
    confirmation_status: t.confirmation_status,
    first_message_id: t.first_message_id,
    last_message_id: t.last_message_id,
    updated_at: t.updated_at,
  }));

  return {
    ...conv,
    is_archived: Boolean(conv.is_archived),
    message_count: formattedMessages.length,
    messages: formattedMessages,
    topics: formattedTopics,
    attachments: attachmentRows,
  };
}

/**
 * 4. Update Conversation (Rename, Archive/Unarchive, Update Active Topic)
 */
export async function updateConversation(
  userId,
  conversationId,
  { title, isArchived, activeTopicId } = {}
) {
  return withTransaction(async () => {
    const existing = await assertConversationOwnership(userId, conversationId);

    const nextTitle =
      title !== undefined
        ? String(title).trim().slice(0, 200)
        : existing.title;

    if (!nextTitle) {
      throw new HttpError(400, 'Conversation title cannot be empty', 'EMPTY_TITLE');
    }

    const nextArchived =
      isArchived !== undefined ? (isArchived ? 1 : 0) : existing.is_archived;

    let nextTopicId = existing.active_topic_id;
    if (activeTopicId !== undefined) {
      if (activeTopicId === null) {
        nextTopicId = null;
      } else {
        const topic = await dbGet(`SELECT id FROM topics WHERE id = ? AND user_id = ?`, [activeTopicId, userId]);
        if (!topic) {
          throw new HttpError(404, 'Referenced topic not found for this user', 'TOPIC_NOT_FOUND');
        }
        nextTopicId = topic.id;
      }
    }

    const now = new Date().toISOString();
    await dbRun(
      `UPDATE conversations
       SET title = ?, is_archived = ?, active_topic_id = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
      [nextTitle, nextArchived, nextTopicId, now, conversationId, userId]
    );

    const updated = await dbGet(`SELECT * FROM conversations WHERE id = ? AND user_id = ?`, [
      conversationId,
      userId,
    ]);
    return {
      ...updated,
      is_archived: Boolean(updated.is_archived),
    };
  });
}

/**
 * 5. Delete Conversation (Preserves generated Vault Notes in files table)
 */
export async function deleteConversation(userId, conversationId) {
  return withTransaction(async () => {
    await assertConversationOwnership(userId, conversationId);

    await dbRun(`DELETE FROM conversation_topics WHERE conversation_id = ? AND user_id = ?`, [
      conversationId,
      userId,
    ]);
    await dbRun(`DELETE FROM attachments WHERE conversation_id = ? AND user_id = ?`, [
      conversationId,
      userId,
    ]);
    await dbRun(`DELETE FROM messages WHERE conversation_id = ? AND user_id = ?`, [
      conversationId,
      userId,
    ]);
    await dbRun(`DELETE FROM conversations WHERE id = ? AND user_id = ?`, [
      conversationId,
      userId,
    ]);

    return { success: true, deletedConversationId: conversationId };
  });
}

/**
 * 6. List Messages in a Conversation
 */
export async function listMessages(userId, conversationId) {
  await assertConversationOwnership(userId, conversationId);
  const rows = await dbAll(
    `SELECT * FROM messages WHERE conversation_id = ? AND user_id = ? ORDER BY created_at ASC, rowid ASC`,
    [conversationId, userId]
  );
  return rows.map(formatMessageRow);
}

/**
 * 7. Create a Message inside a Conversation (Transactional + Safeguard 5 Enforcement)
 */
export async function createMessage(
  userId,
  conversationId,
  {
    role = 'user',
    content = '',
    attachmentIds = [],
    generationStatus = 'completed',
    processingStatus = 'pending',
    processingMetadata = {},
    topicId = null,
  } = {}
) {
  if (!['user', 'assistant', 'system'].includes(role)) {
    throw new HttpError(400, `Invalid message role: "${role}"`, 'INVALID_ROLE');
  }

  const stringContent = typeof content === 'string' ? content : String(content ?? '');
  if (generationStatus === 'completed' && stringContent.trim().length === 0 && (!Array.isArray(attachmentIds) || attachmentIds.length === 0)) {
    throw new HttpError(400, 'Message content cannot be empty for a completed message', 'EMPTY_MESSAGE_CONTENT');
  }

  // Safeguard 5 validation
  const {
    generationStatus: safeGenStatus,
    processingStatus: safeProcStatus,
  } = validateAndResolveMessageStatuses({
    generationStatus,
    processingStatus,
    content: stringContent,
  });

  const safeAttachmentIds = Array.isArray(attachmentIds)
    ? attachmentIds.map((id) => String(id).trim()).filter(Boolean)
    : [];

  return withTransaction(async () => {
    const conv = await assertConversationOwnership(userId, conversationId);

    // Verify ownership of any referenced attachments
    if (safeAttachmentIds.length > 0) {
      const placeholders = safeAttachmentIds.map(() => '?').join(',');
      const foundAttachments = await dbAll(
        `SELECT id FROM attachments WHERE user_id = ? AND id IN (${placeholders})`,
        [userId, ...safeAttachmentIds]
      );
      if (foundAttachments.length !== safeAttachmentIds.length) {
        throw new HttpError(403, 'One or more attachments do not belong to this user or do not exist', 'INVALID_ATTACHMENT_OWNERSHIP');
      }
    }

    // Verify ownership of topicId if provided
    let validTopicId = null;
    if (topicId !== null && topicId !== undefined) {
      const topic = await dbGet(`SELECT id FROM topics WHERE id = ? AND user_id = ?`, [topicId, userId]);
      if (!topic) {
        throw new HttpError(404, 'Referenced topic not found for this user', 'TOPIC_NOT_FOUND');
      }
      validTopicId = topic.id;
    }

    const msgId = generateId('msg');
    const now = new Date().toISOString();

    await dbRun(
      `INSERT INTO messages (
         id, conversation_id, user_id, role, content, attachment_ids, topic_id,
         generation_status, processing_status, processing_metadata, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        msgId,
        conversationId,
        userId,
        role,
        stringContent,
        JSON.stringify(safeAttachmentIds),
        validTopicId,
        safeGenStatus,
        safeProcStatus,
        JSON.stringify(processingMetadata || {}),
        now,
        now,
      ]
    );

    // Bind attachments to this message_id and conversation_id
    if (safeAttachmentIds.length > 0) {
      const placeholders = safeAttachmentIds.map(() => '?').join(',');
      await dbRun(
        `UPDATE attachments SET conversation_id = ?, message_id = ? WHERE user_id = ? AND id IN (${placeholders})`,
        [conversationId, msgId, userId, ...safeAttachmentIds]
      );
    }

    // Auto-title conversation from first user message if still titled "New Conversation"
    let updatedTitle = conv.title;
    if (role === 'user' && conv.title === 'New Conversation' && stringContent.trim().length > 0) {
      const firstLine = stringContent.trim().split('\n')[0].replace(/[#*`~>_]/g, '').trim();
      if (firstLine.length > 0) {
        updatedTitle = firstLine.length > 60 ? `${firstLine.slice(0, 57)}...` : firstLine;
      }
    }

    await dbRun(
      `UPDATE conversations SET title = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
      [updatedTitle, now, conversationId, userId]
    );

    const createdRow = await dbGet(`SELECT * FROM messages WHERE id = ? AND user_id = ?`, [msgId, userId]);
    return formatMessageRow(createdRow);
  });
}

/**
 * 8. Update Message State (e.g., streaming completion, interruption, or knowledge processing status)
 * Enforces Safeguard 5 so interrupted/failed AI responses can never become processed knowledge.
 */
export async function updateMessage(
  userId,
  conversationId,
  messageId,
  { content, generationStatus, processingStatus, processingMetadata, topicId } = {}
) {
  return withTransaction(async () => {
    await assertConversationOwnership(userId, conversationId);

    const existing = await dbGet(
      `SELECT * FROM messages WHERE id = ? AND conversation_id = ? AND user_id = ?`,
      [messageId, conversationId, userId]
    );
    if (!existing) {
      throw new HttpError(404, 'Message not found in this conversation', 'MESSAGE_NOT_FOUND');
    }

    // Safeguard: Never allow mutating original user message content after creation
    if (existing.role === 'user' && content !== undefined && content !== existing.content) {
      throw new HttpError(
        400,
        'Original user messages are immutable raw knowledge and cannot be modified.',
        'IMMUTABLE_USER_MESSAGE'
      );
    }

    const nextContent = content !== undefined ? String(content) : existing.content;
    const nextGenStatus = generationStatus !== undefined ? generationStatus : existing.generation_status;
    const requestedProcStatus = processingStatus !== undefined ? processingStatus : existing.processing_status;

    // Safeguard 5 verification
    const {
      generationStatus: safeGenStatus,
      processingStatus: safeProcStatus,
    } = validateAndResolveMessageStatuses({
      generationStatus: nextGenStatus,
      processingStatus: requestedProcStatus,
      content: nextContent,
    });

    let nextTopicId = existing.topic_id;
    if (topicId !== undefined) {
      if (topicId === null) {
        nextTopicId = null;
      } else {
        const topic = await dbGet(`SELECT id FROM topics WHERE id = ? AND user_id = ?`, [topicId, userId]);
        if (!topic) {
          throw new HttpError(404, 'Referenced topic not found for this user', 'TOPIC_NOT_FOUND');
        }
        nextTopicId = topic.id;
      }
    }

    const existingMeta = safeParseJson(existing.processing_metadata, {});
    const nextMeta =
      processingMetadata !== undefined
        ? { ...existingMeta, ...processingMetadata }
        : existingMeta;

    const now = new Date().toISOString();

    await dbRun(
      `UPDATE messages
       SET content = ?, generation_status = ?, processing_status = ?, processing_metadata = ?, topic_id = ?, updated_at = ?
       WHERE id = ? AND conversation_id = ? AND user_id = ?`,
      [
        nextContent,
        safeGenStatus,
        safeProcStatus,
        JSON.stringify(nextMeta),
        nextTopicId,
        now,
        messageId,
        conversationId,
        userId,
      ]
    );

    await dbRun(
      `UPDATE conversations SET updated_at = ? WHERE id = ? AND user_id = ?`,
      [now, conversationId, userId]
    );

    const updated = await dbGet(`SELECT * FROM messages WHERE id = ? AND user_id = ?`, [messageId, userId]);
    return formatMessageRow(updated);
  });
}

/**
 * 9. Delete a Message
 */
export async function deleteMessage(userId, conversationId, messageId) {
  return withTransaction(async () => {
    await assertConversationOwnership(userId, conversationId);

    const existing = await dbGet(
      `SELECT id FROM messages WHERE id = ? AND conversation_id = ? AND user_id = ?`,
      [messageId, conversationId, userId]
    );
    if (!existing) {
      throw new HttpError(404, 'Message not found in this conversation', 'MESSAGE_NOT_FOUND');
    }

    await dbRun(
      `DELETE FROM messages WHERE id = ? AND conversation_id = ? AND user_id = ?`,
      [messageId, conversationId, userId]
    );

    return { success: true, deletedMessageId: messageId };
  });
}

/**
 * 10. Create or Associate a Knowledge Topic with a Conversation using Safeguard 4 Three Confidence Zones
 */
export async function associateConversationTopic(
  userId,
  conversationId,
  {
    topicId = null,
    topicName = '',
    summary = '',
    keywords = [],
    messageId = null,
    matchConfidence = 1.0,
    isManualOverride = false,
  } = {}
) {
  const classification = isManualOverride
    ? {
        confidence: 1.0,
        zone: 'manual',
        confirmationStatus: 'confirmed',
        recommendedAction: 'consolidate_existing_topic',
      }
    : classifyTopicMatchConfidence(matchConfidence);

  return withTransaction(async () => {
    await assertConversationOwnership(userId, conversationId);

    const now = new Date().toISOString();
    let targetTopic = null;

    if (topicId) {
      targetTopic = await dbGet(`SELECT * FROM topics WHERE id = ? AND user_id = ?`, [topicId, userId]);
      if (!targetTopic) {
        throw new HttpError(404, 'Topic not found for this user', 'TOPIC_NOT_FOUND');
      }
    } else {
      const cleanName = typeof topicName === 'string' ? topicName.trim() : '';
      const normName = normalizeTopicName(cleanName);
      if (!normName) {
        throw new HttpError(400, 'Topic name is required when topicId is not provided', 'MISSING_TOPIC_NAME');
      }

      targetTopic = await dbGet(
        `SELECT * FROM topics WHERE user_id = ? AND normalized_name = ?`,
        [userId, normName]
      );

      // Safeguard 4: If an existing topic with the same name exists, or if we are creating a new topic
      if (!targetTopic) {
        const safeKeywords = Array.isArray(keywords) ? keywords : [];
        const insertRes = await dbRun(
          `INSERT INTO topics (user_id, name, normalized_name, summary, keywords, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [userId, cleanName, normName, summary || '', JSON.stringify(safeKeywords), now, now]
        );
        targetTopic = await dbGet(`SELECT * FROM topics WHERE id = ? AND user_id = ?`, [
          insertRes.lastID,
          userId,
        ]);
      }
    }

    // Upsert into conversation_topics junction with confidence zone tracking
    const existingJunction = await dbGet(
      `SELECT * FROM conversation_topics WHERE conversation_id = ? AND topic_id = ? AND user_id = ?`,
      [conversationId, targetTopic.id, userId]
    );

    if (existingJunction) {
      await dbRun(
        `UPDATE conversation_topics
         SET last_message_id = COALESCE(?, last_message_id),
             message_count = message_count + 1,
             match_confidence = ?,
             match_zone = ?,
             confirmation_status = ?,
             updated_at = ?
         WHERE id = ? AND user_id = ?`,
        [
          messageId,
          classification.confidence,
          classification.zone,
          classification.confirmationStatus,
          now,
          existingJunction.id,
          userId,
        ]
      );
    } else {
      await dbRun(
        `INSERT INTO conversation_topics (
           conversation_id, topic_id, user_id, first_message_id, last_message_id,
           message_count, match_confidence, match_zone, confirmation_status, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
        [
          conversationId,
          targetTopic.id,
          userId,
          messageId,
          messageId,
          classification.confidence,
          classification.zone,
          classification.confirmationStatus,
          now,
          now,
        ]
      );
    }

    // Only switch active_topic_id automatically if high_confidence, manual, or low_confidence (new topic);
    // If ambiguous, keep active_topic_id cautious until confirmed!
    if (classification.zone !== 'ambiguous') {
      await dbRun(
        `UPDATE conversations SET active_topic_id = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
        [targetTopic.id, now, conversationId, userId]
      );
    }

    if (messageId && classification.zone !== 'ambiguous') {
      await dbRun(
        `UPDATE messages SET topic_id = ?, updated_at = ? WHERE id = ? AND conversation_id = ? AND user_id = ?`,
        [targetTopic.id, now, messageId, conversationId, userId]
      );
    }

    return {
      topic: {
        ...targetTopic,
        keywords: safeParseJson(targetTopic.keywords, []),
      },
      classification,
    };
  });
}

/**
 * 11. SQLite FTS5 User-Scoped Knowledge Retrieval (Safeguard 3 & Safeguard 4)
 * Searches vault_fts using BM25 ranking and computes a normalized 3-zone confidence score.
 */
export async function searchVaultKnowledgeFts(userId, rawQuery, limit = 10) {
  if (!rawQuery || typeof rawQuery !== 'string' || !rawQuery.trim()) {
    return [];
  }

  // Sanitize query tokens for FTS5 MATCH syntax
  const tokens = rawQuery
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .slice(0, 12);

  if (tokens.length === 0) {
    return [];
  }

  // Use OR prefix matching so partial multi-word queries retrieve candidate notes ranked by BM25
  const ftsMatchExpr = tokens.map((t) => `"${t}"*`).join(' OR ');
  const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 10), 50);

  const rows = await dbAll(
    `SELECT
       vault_fts.file_id,
       vault_fts.topic_id,
       vault_fts.title,
       snippet(vault_fts, 1, '[', ']', '...', 24) as snippet,
       bm25(vault_fts, 5.0, 1.0, 3.0) as bm25_raw,
       f.path,
       f.note_type,
       f.raw_file_id,
       f.formal_file_id,
       f.updated_at
     FROM vault_fts
     JOIN files f ON CAST(vault_fts.file_id AS INTEGER) = f.id
     WHERE vault_fts MATCH ? AND vault_fts.user_id = ? AND f.user_id = ?
     ORDER BY bm25(vault_fts, 5.0, 1.0, 3.0) ASC
     LIMIT ?`,
    [ftsMatchExpr, userId, userId, safeLimit]
  );

  const normQuery = normalizeTopicName(rawQuery);

  return rows.map((r) => {
    const normTitle = normalizeTopicName(r.title || '');
    const titleWords = new Set(normTitle.split(' ').filter(Boolean));
    const matchedQueryTokens = tokens.filter((t) =>
      normTitle.includes(t) || titleWords.has(t)
    );
    const lexicalOverlap = tokens.length > 0 ? matchedQueryTokens.length / tokens.length : 0;

    // Convert negative SQLite bm25 score into a [0, 1] relevance factor
    const absBm25 = Math.abs(Number(r.bm25_raw) || 0);
    const bm25Factor = Math.min(1, absBm25 / (absBm25 + 6));

    // Exact normalized title match gets >= 0.92 (high_confidence)
    let combinedScore;
    if (normTitle === normQuery || normTitle === `${normQuery} formal`) {
      combinedScore = 0.95;
    } else {
      combinedScore = Number((0.55 * lexicalOverlap + 0.45 * bm25Factor).toFixed(3));
    }

    const classification = classifyTopicMatchConfidence(combinedScore);

    return {
      file_id: Number(r.file_id),
      topic_id: r.topic_id ? Number(r.topic_id) : null,
      title: r.title,
      path: r.path,
      note_type: r.note_type,
      raw_file_id: r.raw_file_id,
      formal_file_id: r.formal_file_id,
      snippet: r.snippet,
      bm25_score: Number((Number(r.bm25_raw) || 0).toFixed(4)),
      match_confidence: classification.confidence,
      match_zone: classification.zone,
      confirmation_status: classification.confirmationStatus,
      recommended_action: classification.recommendedAction,
      updated_at: r.updated_at,
    };
  });
}

