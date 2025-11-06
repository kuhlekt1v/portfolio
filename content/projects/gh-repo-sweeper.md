---
title: GitHub Repo Sweeper
slug: gh-repo-sweeper
description: A lightweight command line utility for managing and cleaning up your GitHub repositories.
longDescription: GitHub Repo Sweeper simplifies repository management for developers by enabling them to easily list, search, and delete repositories using an intuitive command-line interface.
cardImage: "http://codysheridan.com/gh-repo-sweeper.webp"
tags: ["Python", "CLI", "GitHub"]
githubUrl: https://github.com/kuhlekt1v/gh-repo-sweeper
timestamp: 2025-11-06T01:58:44+00:00
featured: true
---

## The Details

GitHub Repo Sweeper is a command-line interface (CLI) utility built for developers who want to efficiently manage their repositories. The tool offers an intuitive menu-driven interface, combining Python with rich libraries to enhance the overall user experience. It provides functionalities for listing all repositories, searching them interactively, and safely deleting those you no longer need.

Built with Python 3.8+ and leveraging the PyGithub and Keyring libraries, this tool focuses on usability and versatility for tech enthusiasts.

## The Features

- **List Repositories**: Retrieve all repositories from your GitHub account swiftly.
- **Interactive Deletion**: Safely delete repositories with preconfigured prompts; irreversible actions require confirmation.
- **Searching Capabilities**: Filter repos by name and/or primary language.
- **PAT Authentication**: Integrates secure access-level tokens securely through keyrings.
- **Usage Transparency**: Combines activity logging.

## The Future

The following enhancements are planned to further improve the Repo Sweeper:

- [Enhance CLI with visual style cues using Python Rich](https://github.com/kuhlekt1v/gh-repo-sweeper/issues/6): Integrating Python's Rich library to enhance console outputs with color coding, tables, and styled messages for better usability.
- [Repo Drill Down](https://github.com/kuhlekt1v/gh-repo-sweeper/issues/5): Add the ability to delve deeper into repositories, including viewing the project structure, last commit messages, and identifying primary contributors.
- [Bundle & Distribute Package Without Requiring Python or Virtual Environments](https://github.com/kuhlekt1v/gh-repo-sweeper/issues/7): Create standalone executables for broader usability without environmental setup, using tools such as PyInstaller or PyOxidizer.

Ultimately, I aim to deploy the CLI for broader usage and make it accessible via live environment distributions for individual users.
