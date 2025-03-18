# Contributing to Web Debugger

Thank you for your interest in contributing to the Web Debugger project! This document provides guidelines and instructions for contributing.

## Table of Contents

-   [Code of Conduct](#code-of-conduct)
-   [Getting Started](#getting-started)
-   [Development Workflow](#development-workflow)
-   [Pull Request Process](#pull-request-process)
-   [Coding Standards](#coding-standards)
-   [Commit Message Guidelines](#commit-message-guidelines)
-   [Branch Naming Conventions](#branch-naming-conventions)
-   [Testing](#testing)
-   [Documentation](#documentation)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone. Please be kind and constructive in your communications.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally:
    ```bash
    git clone https://github.com/yourusername/web-debugger.git
    cd web-debugger
    ```
3. Add the original repository as upstream:
    ```bash
    git remote add upstream https://github.com/originalusername/web-debugger.git
    ```
4. Install dependencies:
    ```bash
    npm install
    ```
5. Start the development server:
    ```bash
    npm start
    ```

## Development Workflow

1. Create a new branch for your feature or bugfix (see [Branch Naming Conventions](#branch-naming-conventions))
2. Make your changes
3. Ensure your code follows the [Coding Standards](#coding-standards)
4. Run tests to ensure everything works correctly
5. Commit your changes following [Commit Message Guidelines](#commit-message-guidelines)
6. Push your branch to your fork
7. Submit a pull request to the main repository

## Pull Request Process

1. Ensure your PR has a clear title and description
2. Link any related issues by mentioning them in the PR description (e.g., "Fixes #123")
3. Make sure all tests pass
4. Request a code review from a maintainer
5. Address any feedback or requested changes
6. Once approved, a maintainer will merge your PR

## Coding Standards

-   Use modern JavaScript (ES6+) with proper encapsulation
-   Follow the established code style (enforced by ESLint)
-   Write readable, well-documented code with JSDoc comments
-   Use meaningful variable and function names
-   Keep functions small and focused on a single responsibility
-   Separate UI from logic where possible

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types:

-   `feat`: A new feature
-   `fix`: A bug fix
-   `docs`: Documentation changes
-   `style`: Code style changes (formatting, etc.)
-   `refactor`: Code changes that neither fix bugs nor add features
-   `perf`: Performance improvements
-   `test`: Adding or fixing tests
-   `chore`: Changes to the build process or tooling

Examples:

-   `feat(colorpicker): add eyedropper functionality`
-   `fix(domexplorer): correct element selection highlighting`
-   `docs(readme): update installation instructions`

## Branch Naming Conventions

-   Feature branches: `feature/short-description`
-   Bug fixes: `fix/issue-description`
-   Documentation: `docs/what-changed`
-   Performance improvements: `perf/what-improved`

## Testing

-   Write unit tests for new functionality
-   Ensure existing tests pass before submitting a PR
-   Test across multiple browsers if making UI changes
-   Run tests with:
    ```bash
    npm test
    ```

## Documentation

-   Update README.md if you add, remove, or change features
-   Document new tools or major changes in the appropriate documentation files
-   Add JSDoc comments to all public functions and classes
-   Include examples for complex functionality

Thank you for contributing to Web Debugger!
