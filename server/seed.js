import { dbAll, dbRun, dbGet } from './db.js';
import { syncFileLinks } from './parser.js';

export const SEED_NOTES = [
  {
    title: 'Machine Learning Overview',
    path: 'Machine Learning Overview.md',
    content: `# Machine Learning Overview

Machine Learning is a subfield of artificial intelligence focused on building systems that learn from data.

## Core Paradigms
- [[Supervised Learning | foundation_for | Predicts outcomes based on labeled training datasets]]
- [[Unsupervised Learning]]
- [[Reinforcement Learning]]

Key optimization in ML relies heavily on [[Gradient Descent | optimizes | Minimizes objective loss functions during training iterations]].
Understanding model generalization requires studying [[Overfitting and Regularization]].`
  },
  {
    title: 'Supervised Learning',
    path: 'Supervised Learning.md',
    content: `# Supervised Learning

Supervised learning algorithms build a mathematical model of a set of data that contains both inputs and desired outputs.

## Common Algorithms
- [[Linear Regression]]
- [[Support Vector Machines | classification_tool | Separates data hyperplanes with maximum margin]]
- [[Neural Networks | scalable_model | Learns non-linear feature representations]]

Supervised learning models rely on calculating prediction errors via [[Loss Functions | evaluates_model | Computes variance between targets and predictions]].`
  },
  {
    title: 'Gradient Descent',
    path: 'Gradient Descent.md',
    content: `# Gradient Descent

Gradient descent is a first-order iterative optimization algorithm for finding a local minimum of a differentiable function.

## Key Principles
- Computes partial derivatives using [[Matrix Calculus | mathematical_basis | Calculates gradient vectors across weight matrices]].
- Utilizes step size (learning rate) to step in direction of steepest descent.
- Commonly applied in training [[Neural Networks]] via [[Backpropagation | update_mechanism | Propagates gradients backwards through layers]].

Requires smooth objective functions modeled in [[Convex Optimization]].`
  },
  {
    title: 'Neural Networks',
    path: 'Neural Networks.md',
    content: `# Neural Networks

Artificial Neural Networks (ANNs) are computing systems inspired by biological neural networks.

## Architecture
- Input Layer, Hidden Layers, Output Layer
- Activated via non-linear activation functions (ReLU, Sigmoid, Softmax)

Training is driven by [[Backpropagation | parameter_update | Computes layer gradients efficiently]] using [[Gradient Descent]].
Advanced deep networks form the core of [[Deep Learning Architecture | extends | Scales shallow architectures to multi-layer representations]].`
  },
  {
    title: 'Support Vector Machines',
    path: 'Support Vector Machines.md',
    content: `# Support Vector Machines

Support Vector Machines (SVMs) are supervised learning models with associated learning algorithms that analyze data for classification and regression analysis.

## Key Concepts
- Maximum margin hyperplanes
- Support vectors
- Kernel Trick for mapping non-linear decision boundaries

SVM objective optimization leverages principles from [[Convex Optimization | theoretical_framework | Formulated as quadratic programming optimization problems]].`
  },
  {
    title: 'Overfitting and Regularization',
    path: 'Overfitting and Regularization.md',
    content: `# Overfitting and Regularization

Overfitting occurs when a statistical model fits exactly against its training data, failing to generalize to unseen data.

## Regularization Techniques
- L1 Regularization (Lasso) - encourages sparsity
- L2 Regularization (Ridge) - penalizes large weights
- Dropout in [[Neural Networks]]

Essential for robust model deployment in [[Machine Learning Overview]].`
  },
  {
    title: 'Loss Functions',
    path: 'Loss Functions.md',
    content: `# Loss Functions

A loss function maps decisions onto cost functions associated with those decisions.

## Common Examples
- Mean Squared Error (MSE) for regression
- Cross-Entropy Loss for classification

Loss functions dictate gradient updates in [[Gradient Descent | guides_optimization | Defines error surface curvature]].`
  },
  {
    title: 'Deep Learning Architecture',
    path: 'Deep Learning Architecture.md',
    content: `# Deep Learning Architecture

Deep Learning models utilize stacked layers to progressively extract higher-level features from raw input.

## Popular Architectures
- Convolutional Neural Networks (CNNs)
- Recurrent Neural Networks (RNNs)
- [[Transformer Architecture | modern_standard | Replaces recurrent layers with parallel self-attention computation]]

Relies on [[Neural Networks]] foundation.`
  },
  {
    title: 'Backpropagation',
    path: 'Backpropagation.md',
    content: `# Backpropagation

Backpropagation is a widely used algorithm in training feedforward neural networks for computation of gradients.

## Mechanism
- Forward pass to calculate prediction loss
- Backward pass using Chain Rule from [[Matrix Calculus | relies_on | Uses multivariable chain rule for chain derivatives]]

Directly feeds parameter updates to [[Gradient Descent]].`
  },
  {
    title: 'Transformer Architecture',
    path: 'Transformer Architecture.md',
    content: `# Transformer Architecture

Transformers rely entirely on self-attention mechanisms to draw global dependencies between input and output.

## Innovations
- Positional Encodings
- [[Self Attention Mechanism | core_component | Computes Query Key Value dot-product attention scores]]
- Multi-Head Attention

Dominates modern sequence modeling in [[Deep Learning Architecture]].`
  },
  {
    title: 'Self Attention Mechanism',
    path: 'Self Attention Mechanism.md',
    content: `# Self Attention Mechanism

Self-attention connects different positions of a single sequence to compute a representation of the sequence.

$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$

Fundamental building block of [[Transformer Architecture]].`
  },
  {
    title: 'Convex Optimization',
    path: 'Convex Optimization.md',
    content: `# Convex Optimization

Convex optimization studies the problem of minimizing convex functions over convex sets.

## Significance
- Guarantees local minima are global minima.
- Provides mathematical guarantees for [[Support Vector Machines]] and constrained [[Gradient Descent]] applications.`
  },
  {
    title: 'Matrix Calculus',
    path: 'Matrix Calculus.md',
    content: `# Matrix Calculus

Matrix calculus collects multivariable calculus into single vector and matrix notation.

## Applications
- Jacobian & Hessian matrices
- Gradient computation in [[Backpropagation | mathematical_tool | Enables derivative evaluation across high dimensional weight tensors]]
- Linear algebra operations in [[Data Structures and Algorithms]].`
  },
  {
    title: 'Data Structures and Algorithms',
    path: 'Data Structures and Algorithms.md',
    content: `# Data Structures and Algorithms

Fundamental building blocks of software engineering and computer science.

## Topics
- Arrays, Trees, Hash Tables
- [[Graph Theory | specialized_branch | Models relational network structures and node traversals]]
- Sorting and Searching`
  },
  {
    title: 'Graph Theory',
    path: 'Graph Theory.md',
    content: `# Graph Theory

Graph theory is the study of graphs, which are mathematical structures used to model pairwise relations between objects.

## Applications
- Force-directed layouts in [[System Architecture]]
- Knowledge Graphs and linked note network representations.`
  },
  {
    title: 'System Architecture',
    path: 'System Architecture.md',
    content: `# System Architecture

System Architecture defines the conceptual model, structure, and behavior of software systems.

- Microservices & Monoliths
- Data storage layer optimization in [[Data Structures and Algorithms]]
- Knowledge management applications.`
  }
];

export async function seedDatabase() {
  const existingFiles = await dbAll(`SELECT COUNT(*) as count FROM files`);
  if (existingFiles[0].count === 0) {
    console.log('Seeding initial vault notes...');
    const now = new Date().toISOString();

    for (const note of SEED_NOTES) {
      const res = await dbRun(
        `INSERT INTO files (title, path, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
        [note.title, note.path, note.content, now, now]
      );
      await syncFileLinks(res.lastID, note.content);
    }
    console.log(`Successfully seeded ${SEED_NOTES.length} notes and synced links!`);
  }
}
