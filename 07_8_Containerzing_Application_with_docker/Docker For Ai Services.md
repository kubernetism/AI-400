# AI Cloud Native Development: Docker For Ai Services

> Downloaded from Agent Factory on 3/6/2026
> Total lessons: 9

## Table of Contents

1. [Build Your Docker Skill](#build-your-docker-skill)
2. [Docker Installation & Setup](#docker-installation-setup)
3. [Container Fundamentals: Images, Containers, and Layers](#container-fundamentals-images-containers-and-layers)
4. [Writing Your First Dockerfile](#writing-your-first-dockerfile)
5. [Container Lifecycle and Debugging](#container-lifecycle-and-debugging)
6. [Multi-Stage Builds & Optimization](#multi-stage-builds-optimization)
7. [Production Hardening](#production-hardening)
8. [Docker Image Builder Skill](#docker-image-builder-skill)
9. [Capstone: Containerize Your API](#capstone-containerize-your-api)

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 49: Docker for AI Services](/docs/AI-Cloud-Native-Development/docker-for-ai-services)
-   Build Your Docker Skill

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/49-docker-for-ai-services/00-build-your-docker-skill.md)

# Build Your Docker Skill

Before learning Docker—containerizing your applications for production—you'll **own** a Docker skill.

* * *

## Step 1: Get the Skills Lab

1.  Go to [github.com/panaversity/claude-code-skills-lab](https://github.com/panaversity/claude-code-skills-lab)
2.  Click the green **Code** button
3.  Select **Download ZIP**
4.  Extract the ZIP file
5.  Open the extracted folder in your terminal

```
cd claude-code-skills-labclaude
```

* * *

## Step 2: Create Your Skill

Copy and paste this prompt:

```
Using your skill creator skill create a new skill for Docker. I will useit to containerize Python/FastAPI applications from hello world to professionalproduction deployments. Use context7 skill to study official documentationand then build it so no self assumed knowledge.
```

Claude will:

1.  Fetch official Docker documentation via Context7
2.  Ask you clarifying questions (base images, multi-stage builds, security patterns)
3.  Create the complete skill with references and templates

Your skill appears at `.claude/skills/docker-deployment/`.

* * *

## Done

You now own a Docker skill built from official documentation. The rest of this chapter teaches you what it knows—and how to make it better.

**Next: Lesson 1 — Docker Fundamentals**

Checking access...

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 49: Docker for AI Services](/docs/AI-Cloud-Native-Development/docker-for-ai-services)
-   Docker Installation & Setup

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/49-docker-for-ai-services/01-docker-installation-and-setup.md)

# Docker Installation & Setup

Your FastAPI agent runs perfectly on your machine. But "works on my machine" doesn't scale to production or your team's machines. Docker solves this fundamental problem by packaging your agent, its dependencies, and its runtime into a container that runs identically everywhere—your laptop, a teammate's Mac, or a cloud server.

Before you experience the power of containerization through AI collaboration, you need to understand what Docker actually is. This lesson walks you through installation and initial setup manually, building the mental model you'll need to optimize containers and debug issues later.

* * *

## Why Containers? The Problem They Solve

Before diving into Docker, understand the problem it solves and why it's become essential for deploying AI services.

### The Deployment Problem

Your FastAPI agent from Part 6 works on your laptop. But to make it useful, you need to run it somewhere accessible—a server in the cloud, your company's data center, or a colleague's machine. This is where things break:

Your Machine

Production Server

Python 3.12

Python 3.9

macOS

Ubuntu Linux

Dependencies installed globally

Different versions installed

Environment variables set in .zshrc

No environment configured

Model files in ~/Downloads

Where are the model files?

Every difference is a potential bug. The server says "Module not found." You say "But it works on my machine!"

### Three Ways to Deploy Software

**Option 1: Manual Setup (Fragile)**

SSH into the server, install Python, pip install dependencies, copy files, configure environment variables, hope nothing changed since yesterday.

Problems: Slow, error-prone, not reproducible. Works until someone updates a system package.

**Option 2: Virtual Machines (Heavy)**

Package the entire operating system—kernel, libraries, your application—into a VM image. Run the VM on any hypervisor (VMware, VirtualBox, cloud providers).

```
┌─────────────────────────────────────┐│           Your Application          │├─────────────────────────────────────┤│    Python, Dependencies, Files      │├─────────────────────────────────────┤│         Guest OS (Ubuntu)           │├─────────────────────────────────────┤│         Hypervisor (VMware)         │├─────────────────────────────────────┤│         Host OS (macOS/Windows)     │├─────────────────────────────────────┤│            Hardware                 │└─────────────────────────────────────┘
```

Problems: Each VM needs its own OS (gigabytes of storage), boots in minutes, wastes RAM running duplicate kernels. Running 10 services means 10 operating systems.

**Option 3: Containers (Lightweight)**

Package your application and dependencies, but **share the host kernel**. No duplicate operating system. Start in milliseconds. Use megabytes instead of gigabytes.

```
┌──────────┐  ┌──────────┐  ┌──────────┐│  App 1   │  │  App 2   │  │  App 3   │├──────────┤  ├──────────┤  ├──────────┤│  Deps    │  │  Deps    │  │  Deps    │└──────────┴──┴──────────┴──┴──────────┘           Container Runtime├─────────────────────────────────────┤│           Host OS (Linux)           │├─────────────────────────────────────┤│            Hardware                 │└─────────────────────────────────────┘
```

**Key insight**: Containers share the host's kernel. They're isolated processes, not full operating systems. This makes them:

-   **Fast**: Start in under a second (VMs take minutes)
-   **Small**: 50-200MB typical (VMs are 2-10GB)
-   **Efficient**: Run 100 containers on a laptop (10 VMs would exhaust RAM)
-   **Portable**: Same container runs on any Linux kernel (development to production)

### Why Containers Matter for AI Services

Your AI agent has specific requirements:

1.  **Large dependencies**: PyTorch, transformers, numpy—hundreds of megabytes of packages
2.  **Specific versions**: Model trained on transformers 4.35.0 breaks on 4.36.0
3.  **Environment variables**: API keys, model paths, configuration
4.  **GPU access**: Some AI workloads need NVIDIA CUDA (containers support this)
5.  **Reproducibility**: Must reproduce exact behavior for debugging

Containers solve all of these by freezing your entire environment into an immutable, portable package. When you deploy to the cloud, you're not hoping the server is configured correctly—you're shipping the exact environment that works.

### Cloud Computing Context

If you're new to cloud computing, here's the essential context:

**Cloud providers** (AWS, Google Cloud, Azure, DigitalOcean) rent you servers by the hour. These servers run Linux. You deploy your application to these servers.

**Without containers**: You configure each server manually, install dependencies, copy files. Different servers drift out of sync.

**With containers**: You build once, push to a registry (like Docker Hub), and pull onto any server. The container is identical everywhere.

**Kubernetes** (Chapter 50) orchestrates many containers across many servers—handling load balancing, failover, and scaling. But first, you need to know how to build and run a single container. That's what Docker teaches you.

* * *

## Prerequisites: What You Need Before Starting

Check that your system meets these baseline requirements:

Requirement

How to Check

**macOS 11.0+** OR **Windows 10/11** OR **Linux (Ubuntu 18.04+, Fedora, etc.)**

You're reading this, so you have a system

**4 GB RAM minimum**

macOS: Apple menu → About This Mac; Windows: Settings → System → About; Linux: `free -h`

**2 CPU cores minimum**

For AI workloads, we'll allocate 4GB RAM + 2 CPUs minimum

**10 GB free disk space**

For Docker images and containers

**Reliable internet connection**

We'll download ~2GB during setup

### Don't Have Minimum Resources?

If your machine is underpowered, you have options:

1.  **Cloud alternative**: Install Docker on a cloud VM (AWS EC2 t3.small, Google Cloud e2-standard-2, or DigitalOcean $5/month droplet)
2.  **Shared machine**: Use a lab computer or colleague's system
3.  **Defer chapter**: Complete Part 6 (agent fundamentals) while planning infrastructure upgrades

* * *

## What Is Docker? The Mental Model

Before installing anything, understand what we're installing. Docker has three essential components:

### Component 1: Docker Engine (The Runtime)

This is the core. The Docker Engine is a lightweight process that runs on your operating system and:

-   Creates isolated containers from images
-   Manages container lifecycle (start, stop, remove)
-   Handles networking between containers
-   Manages storage and volumes

**Think of it like**: A process manager—like `systemd` on Linux or Task Manager on Windows, but specialized for containers.

### Component 2: Docker Desktop (The Complete Package)

On macOS and Windows, you can't install Docker Engine directly (it's Linux-native). Docker Desktop solves this by:

-   Running a lightweight Linux VM (using Hypervisor.framework on macOS, Hyper-V on Windows)
-   Installing Docker Engine inside that VM
-   Providing a GUI dashboard for viewing containers and images
-   Handling networking so containers feel like they're on your machine

**Important**: Docker Desktop is NOT Docker Engine. Desktop is the *packaging and UI* around Engine.

### Component 3: containerd (The Container Runtime)

Inside Docker Engine runs containerd, a lower-level component that actually:

-   Pulls container images from registries
-   Extracts images to filesystems
-   Creates cgroups and namespaces (Linux kernel features that provide isolation)
-   Starts container processes

**You rarely interact with containerd directly**, but it's the reason containers are so lightweight—they don't need a full operating system like VMs do.

### The Architecture Stack

```
Your Machine (macOS/Windows)    ↓Docker Desktop (GUI + VM)    ↓Linux VM (inside Docker Desktop)    ↓Docker Engine    ↓containerd    ↓Containers (your FastAPI agent, databases, etc.)
```

On Linux, the stack is simpler (no VM needed):

```
Your Linux Machine    ↓Docker Engine    ↓containerd    ↓Containers
```

* * *

## Installation by Operating System

-   macOS
-   Windows
-   Linux

**Supported versions**: macOS 11.0 (Big Sur) and later

**Step 1: Download Docker Desktop**

Visit [Docker's official download page](https://www.docker.com/products/docker-desktop) and click the macOS download button. You'll see two options:

-   **Apple Silicon (M1/M2/M3)**: For newer Macs with Apple chips
-   **Intel**: For Intel-based Macs

Check which you have: Apple menu → About This Mac → Look for "Chip: Apple M2" (Silicon) or "Processor: Intel Core" (Intel).

**Step 2: Install Docker Desktop**

1.  Open your Downloads folder
2.  Double-click `Docker.dmg`
3.  Drag the Docker icon to the Applications folder
4.  Wait for copy to complete (usually 1-2 minutes)
5.  Eject the disk image by dragging it to Trash

**Step 3: Launch Docker**

1.  Open Applications folder
2.  Double-click Docker.app
3.  Enter your password when prompted (Docker needs to install system components)
4.  Wait for "Docker is running" to appear in the menu bar (top right)

Docker Desktop is now running. You'll see the Docker icon in your menu bar at the top right.

**Supported versions**: Windows 10 (21H2 and later) or Windows 11

**Prerequisites check**: Docker Desktop on Windows requires Hyper-V. Check if it's enabled:

```
# In PowerShell (as Administrator)Get-WindowsOptionalFeature -Online -FeatureName Hyper-V | Select-Object -Property Name, State
```

**Expected output**:

```
Name  State----  -----Hyper-V Enabled
```

If State is "Disabled", you need to enable Hyper-V first:

```
# In PowerShell (as Administrator)Enable-WindowsOptionalFeature -Online -FeatureName Hyper-V -All
```

Restart your computer when prompted.

**Step 1: Download Docker Desktop**

Visit [Docker's official download page](https://www.docker.com/products/docker-desktop) and click the Windows download button. This downloads `Docker Desktop Installer.exe`.

**Step 2: Install**

1.  Double-click `Docker Desktop Installer.exe`
2.  Follow the installation wizard (use default settings)
3.  Check "Use WSL 2 instead of Hyper-V" (WSL 2 is recommended for performance)
4.  Click Install

Installation takes 2-5 minutes.

**Step 3: Launch Docker**

1.  Search "Docker Desktop" in your Start menu
2.  Click to launch
3.  Wait for "Docker Desktop is running" notification (taskbar shows Docker icon)

You'll see Docker icon in your system tray (bottom right).

**Supported distributions**: Ubuntu 18.04+, Fedora, Debian, CentOS, etc.

Docker Engine runs natively on Linux, so installation is simpler (no VM needed).

**Ubuntu/Debian:**

```
# Update package indexsudo apt-get update# Install prerequisitessudo apt-get install -y ca-certificates curl gnupg lsb-release# Add Docker's official GPG keycurl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg# Add Docker repositoryecho \  "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null# Install Docker Enginesudo apt-get updatesudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin# Add your user to docker group (so you don't need sudo every time)sudo usermod -aG docker $USER# Activate the changenewgrp docker
```

**Expected output** (after installation completes):

```
Setting up docker-ce (5:24.0.0~3-0~ubuntu-jammy) ......Processing triggers for man-db (2.11.2-1) ...
```

**Fedora/RHEL:**

```
sudo dnf -y install dnf-plugins-coresudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.reposudo dnf install docker-ce docker-ce-cli containerd.io docker-compose-pluginsudo systemctl start dockersudo usermod -aG docker $USERnewgrp docker
```

* * *

## Verify Installation

No matter your OS, verify Docker installed correctly by checking the version:

```
docker version
```

**Expected output** (macOS/Windows/Linux):

```
Client: Cloud integration: v1.0.35 Version:           24.0.0 API version:       1.43 Go version:        go1.20.4 Git commit:        62409b4 Built:             Thu May 25 11:30:12 2023 OS/Arch:           darwin/arm64 Context:           defaultServer: Docker Desktop Engine:  Version:          24.0.0  API version:      1.43 (minimum version 1.12)  Go version:       go1.20.4  Git commit:       61876b8  Built:            Thu May 25 11:30:34 2023  OS/Arch:          linux/arm64  Experimental:     false containerd:  Version:          1.6.21  GitCommit:        3dce8eb055cbb6872793272b4f20ed16117344f8 runc:  Version:          1.1.7  GitCommit:        v1.1.7-0-g860f061
```

Key confirmation: You see **both Client and Server** sections. The Client is your terminal, the Server is Docker Engine running behind the scenes.

If you see only "Client" without "Server," Docker Engine isn't running. Restart Docker Desktop and try again.

* * *

## Run Your First Container

Now test that the entire system works end-to-end:

```
docker run hello-world
```

**Expected output**:

```
Unable to find image 'hello-world:latest' locallylatest: Pulling from library/hello-world719385e32844: Pull completeDigest: sha256:926fac19d22f26fc3d2d91fa13a...Status: Downloaded newer image for hello-world:latestHello from Docker!This message shows that your installation appears to be working correctly.To generate this message, Docker took the following steps: 1. The Docker client contacted the Docker daemon. 2. The Docker daemon pulled the "hello-world" image from the Docker Hub. 3. The Docker daemon created a new container from that image which runs the    executable that produces the output you are currently reading. 4. The Docker daemon streamed that output to the Docker client, which sent it    to your terminal.
```

What just happened:

1.  Docker looked for `hello-world` image locally (not found on first run)
2.  Docker pulled the image from Docker Hub (the public registry)
3.  Docker created and started a container from that image
4.  The container printed its message and exited

**Congratulations**: You've just created and run your first container. This single command validates:

-   Docker Engine is running
-   Your network connection works
-   Image pulling works
-   Container creation works

* * *

## Configure Docker Desktop for AI Workloads

By default, Docker Desktop allocates limited resources. For AI services (which are memory-hungry), you need to configure resources.

-   macOS
-   Windows
-   Linux

1.  Click Docker icon in menu bar → Preferences (or Settings)
    
2.  Select **Resources** tab
    
3.  Adjust these settings:
    
    -   **CPUs**: 4 (minimum for AI workloads)
    -   **Memory**: 8 GB (minimum 4GB, but AI models benefit from more)
    -   **Disk Image Size**: 100 GB (default may be too small for large model files)
    -   **Swap**: 2 GB (helps when memory is tight)
4.  Click **Apply & Restart**
    
5.  Docker restarts with new limits
    

1.  Right-click Docker icon in system tray → Settings
    
2.  Select **Resources** tab
    
3.  Adjust these settings:
    
    -   **CPUs**: 4
    -   **Memory**: 8 GB
    -   **Disk space**: 100 GB
    -   **Virtual disk limit**: 100 GB
4.  Click **Apply & Restart**
    

On Linux, Docker uses system resources directly (no VM overhead). Configure at container level instead:

When you run your agent container, specify resource limits:

```
docker run \  --memory=4g \  --cpus=2 \  your-agent-image
```

**Expected output** (after container starts):

```
Container started with 4GB memory limit and 2 CPU cores
```

This reserves 4GB RAM and 2 CPUs for the container.

* * *

## Understanding Docker Desktop GUI

Docker Desktop provides a GUI for visualizing your containers and images. Explore it now:

**macOS**: Click Docker icon (top right) → Dashboard opens

**Windows**: Click Docker icon (system tray, bottom right) → Dashboard opens

**Linux**: Not available (Docker runs natively without GUI)

### Containers Tab

Shows all containers on your system. You'll see:

-   **hello-world** container you just ran (status: Exited)
-   Any other containers you've created

Columns show:

-   Container name
-   Image it was created from
-   Current status (Running, Exited)
-   Ports being exposed
-   When it was created

### Images Tab

Shows all images stored locally:

-   **hello-world** image you pulled earlier
-   When you build custom Dockerfiles, they appear here
-   Shows image size

**Experiment**: Click on the **Containers** tab and delete the hello-world container by clicking the trash icon. The container is removed (the image remains for future use).

* * *

## Common Installation Issues & Recovery

### Issue: "Docker Desktop won't start" (macOS/Windows)

**Diagnosis**: Check that virtualization is enabled:

-   **macOS**: Virtualization is typically enabled by default
-   **Windows**: Check that Hyper-V is enabled (see Windows installation section)

**Recovery**:

1.  Restart your computer
2.  Try launching Docker Desktop again
3.  If still fails: Uninstall Docker Desktop, restart, reinstall

### Issue: "Permission denied" when running docker commands (Linux)

**Cause**: Your user is not in the docker group

**Recovery**:

```
sudo usermod -aG docker $USERnewgrp dockerdocker run hello-world  # Try again
```

**Expected output** (after fix):

```
Hello from Docker!This message shows that your installation appears to be working correctly.
```

### Issue: "Cannot connect to Docker daemon" (All platforms)

**Cause**: Docker Engine isn't running

**Recovery**:

-   **macOS/Windows**: Open Docker Desktop application
-   **Linux**: `sudo systemctl start docker`

Then retry your command.

### Issue: "Image pull failed" during `docker run`

**Cause**: Network issue or Docker Hub is temporarily down

**Recovery**:

1.  Check your internet connection
2.  Wait a few minutes (Docker Hub may be temporarily unavailable)
3.  Try again: `docker pull hello-world` then `docker run hello-world`

* * *

## Architecture Review: Putting It Together

Now that Docker is running, you understand these key relationships:

**Docker Desktop** (macOS/Windows) = lightweight VM + Docker Engine + GUI dashboard

**Docker Engine** = the actual process managing containers on the Linux kernel

**containerd** = the lower-level runtime creating isolated processes

**Images** = blueprints (like a class definition)

**Containers** = running instances (like an object instantiated from that class)

When you run `docker run hello-world`:

1.  Docker Engine checks if hello-world image exists locally
2.  If not, containerd pulls it from Docker Hub
3.  containerd extracts the image layers to a filesystem
4.  containerd creates a new isolated process (using cgroups/namespaces)
5.  That process runs the hello-world program
6.  Process exits, container stops (but image and container remain on disk)

For your FastAPI agent in future lessons, this same flow applies:

1.  Docker Engine pulls your custom agent image
2.  containerd sets up an isolated filesystem with your code + dependencies
3.  containerd starts the Python process running your FastAPI server
4.  Your agent is now isolated—it can't access other system files or crash other processes

* * *

## Try With AI

Now that Docker is installed and configured, explore container concepts further with your AI companion.

### Prompt 1: Understand the Architecture Deeply

```
I just installed Docker and learned about Docker Desktop, Docker Engine, andcontainerd. I understand they form a stack, but I'm not clear on when I'dinteract with each layer. Can you explain:1. When would a developer interact directly with containerd vs Docker Engine?2. Why does Docker Desktop need a Linux VM on macOS/Windows?3. If containers share the host kernel, how are they actually isolated?Use concrete examples from deploying a Python FastAPI application.
```

**What you're learning**: Understanding architectural layers helps you debug issues at the right level. When something breaks, you'll know whether it's a Docker Desktop issue, Engine configuration, or container runtime problem.

### Prompt 2: Compare with Your Mental Model

```
I've been thinking of Docker containers as "lightweight VMs." But I learnedcontainers share the kernel while VMs don't. Help me refine my mental model:1. What can go wrong if two containers share the same kernel?2. Why are containers faster to start than VMs?3. For my AI agent that needs specific Python packages and environment   variables, what exactly gets "frozen" in a container vs what's dynamic?Challenge my understanding if I have misconceptions.
```

**What you're learning**: Refining mental models through dialogue. Your AI partner identifies gaps in understanding and helps you build accurate intuitions about container technology.

### Prompt 3: Plan for AI Workload Requirements

```
I configured Docker Desktop with 8GB RAM and 4 CPUs for AI workloads. ButI'm not sure if that's enough or overkill. My AI agent uses:- FastAPI for the API layer- A small language model (maybe 2-3GB)- Some numpy/pandas processingHelp me think through:1. How do I estimate memory needs for this workload?2. What happens if my container exceeds the memory limit?3. Should I set resource limits per container, or rely on Docker Desktop limits?Ask me clarifying questions about my specific use case if needed.
```

**What you're learning**: Resource planning for production workloads. Understanding memory and CPU allocation prevents out-of-memory crashes and helps you size cloud infrastructure correctly.

### Safety Note

Docker provides process isolation, not security isolation. Containers share the host kernel, so a kernel vulnerability could affect all containers. For production deployments with sensitive data, use additional security layers (network policies, secrets management) covered in later lessons.

* * *

## Reflect on Your Skill

You built a `docker-deployment` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my docker-deployment skill, verify I have Docker Desktop properly configured.Does my skill check for Docker Engine prerequisites and resource allocation?
```

### Identify Gaps

Ask yourself:

-   Did my skill include Docker Desktop installation steps?
-   Did it handle resource configuration for AI workloads?

### Improve Your Skill

If you found gaps:

```
My docker-deployment skill is missing prerequisite verification and resource configuration.Update it to include Docker Desktop setup validation and appropriate memory/CPU allocation for AI services.
```

* * *

Checking access...

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 49: Docker for AI Services](/docs/AI-Cloud-Native-Development/docker-for-ai-services)
-   Container Fundamentals: Images, Containers, and Layers

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/49-docker-for-ai-services/02-container-fundamentals.md)

# Container Fundamentals: Images, Containers, and Layers

Think of containers like shipping containers in the real world. A shipping container is a standardized box: 20 feet or 40 feet long, built to a spec that works on trucks, ships, and trains. What's inside changes—steel coils, electronics, clothing—but the container itself is identical. You can move it anywhere, and the contents stay protected and organized.

Software containers work the same way. A container is a standardized package holding your application, its dependencies, and configuration. It runs identically on your laptop, a colleague's machine, or a cloud server. The operating system might be different, but the container guarantees consistency.

In this lesson, you'll explore the mechanics of containers by hands-on discovery: pulling actual images, running them, stopping them, and examining their internal structure. Through this exploration, you'll build the mental model that enables you to write and optimize containers effectively.

* * *

## The Core Distinction: Images vs Containers

Here's the fundamental concept that unlocks everything:

**Images are templates. Containers are instances.**

Just like a class in Python defines a blueprint (the image) and objects are instantiated from that class (the containers), Docker works the same way.

### Images: The Blueprint

An image is a **read-only template**. It contains:

-   A minimal operating system (Alpine Linux, Ubuntu, Debian)
-   Your application code
-   All dependencies (Python, Node, Java, libraries)
-   Configuration files
-   Instructions for how to start the application

Images live in registries (Docker Hub, GitHub Container Registry, cloud provider registries). You pull them from the registry to your machine.

Example image names:

-   `python:3.12-slim` — Python 3.12 with minimal OS
-   `nginx:alpine` — Nginx web server with Alpine Linux
-   `node:20-alpine` — Node.js runtime with Alpine Linux

### Containers: Running Instances

A container is a **running instance** created from an image. It's:

-   What actually executes on your machine
-   A live process with a file system, network, and memory
-   Writable (changes happen at runtime)
-   Isolated from other containers and the host

When you run a container, Docker:

1.  Takes the image (the template)
2.  Creates a writable layer on top
3.  Starts the process inside
4.  Connects it to the network and file system

Multiple containers can run from the same image simultaneously, each isolated from the others.

### The Analogy in Action

Think of making coffee:

-   **Image**: The recipe (beans, water, filter, brewing time)
-   **Container**: The actual cup of coffee you make right now
-   **Run another**: You can make 10 cups from the same recipe at the same time

Each cup exists independently. Changes to one cup (adding sugar) don't affect others.

* * *

## The Critical Concept: Images Are Immutable

This is one of the most important concepts in Docker: **images are immutable** (unchangeable).

Once an image is built, it never changes. Not modified. Not updated. Not patched. It's frozen forever.

### Why Immutability Matters

**Reproducibility**: If you pull `python:3.12-slim` today and again in 6 months, you get the exact same image (identified by its SHA256 digest). No surprises.

**Security**: You can verify an image hasn't been tampered with. The digest `sha256:8a3f4d9e5c2b...` is a cryptographic fingerprint. If a single byte changes, the digest changes.

**Rollbacks**: Running a bad version? Switch back to the previous image instantly. The old image still exists unchanged.

**Caching**: Docker can aggressively cache because layers never change. If layer `a803e7c4b030` exists locally, Docker doesn't re-download it—ever.

### But Containers Can Write Files?

Yes. Here's how Docker reconciles immutability with runtime changes:

```
┌─────────────────────────────────────┐│     Container (writable layer)      │  ← Your runtime changes go here├─────────────────────────────────────┤│     Image Layer 4 (read-only)       │  ← Application code├─────────────────────────────────────┤│     Image Layer 3 (read-only)       │  ← Dependencies├─────────────────────────────────────┤│     Image Layer 2 (read-only)       │  ← Package updates├─────────────────────────────────────┤│     Image Layer 1 (read-only)       │  ← Base OS (Alpine, Debian)└─────────────────────────────────────┘
```

When you run a container, Docker adds a thin **writable layer** on top of the immutable image layers. This is called **copy-on-write**:

-   **Reading a file**: Docker looks through layers top-to-bottom until it finds the file
-   **Writing a file**: Docker copies the file to the writable layer, then modifies the copy
-   **Deleting a file**: Docker marks it deleted in the writable layer (original unchanged)

When you delete the container, the writable layer is discarded. The image remains pristine.

### Practical Implications

1.  **Don't store important data in containers**: When the container dies, writable layer data is lost. Use volumes for persistence (Lesson 6).
    
2.  **Multiple containers, same image**: 10 containers from `nginx:alpine` share the same image layers. Only their writable layers differ. This is why containers are so lightweight.
    
3.  **Debugging in production**: You can `docker exec` into a container to investigate, but any files you create disappear when the container restarts. Logs and metrics should go to external systems.
    
4.  **Image tags can be reassigned**: `python:3.12-slim` might point to different images over time (as Python releases patches). For true immutability, reference images by digest: `python@sha256:8a3f4d9e5c2b...`
    

* * *

## Pulling Images from Docker Hub

Docker Hub is the default registry where images live. Think of it like GitHub for Docker images.

Let's pull a real image and see it arrive on your system.

### Pull Python Image

```
docker pull python:3.12-slim
```

**Output:**

```
3.12-slim: Pulling from library/python7264a8db6058: Pull complete28ffb91f2e74: Pull complete5abc33a71234: Pull completea12c5a6b1c00: Pull completeDigest: sha256:8a3f4d9e5c2b1a9f7c6e4d3b2a1f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3aStatus: Downloaded newer image for python:3.12-slim
```

### Pull Nginx Image

```
docker pull nginx:alpine
```

**Output:**

```
alpine: Pulling from library/nginxa803e7c4b030: Pull complete8c2be06b0893: Pull complete68b0f6f0e0d6: Pull completeDigest: sha256:a8a6e48d1a8c4c6b2d1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0dStatus: Downloaded newer image for nginx:alpine
```

When you pull an image, you're downloading the image **layers** (we'll explore those shortly). Notice the `Pull complete` messages—each line represents a layer being downloaded.

### List Downloaded Images

Now that images are on your machine, list them:

```
docker images
```

**Output:**

```
REPOSITORY    TAG       IMAGE ID       CREATED       SIZEnginx         alpine    f5ae1a5d5c8b   2 weeks ago   41.2MBpython        3.12-slim e9b5c4a3d2c1   1 week ago    126MB
```

You now have two image templates on your machine. Neither is running—they're just available to create containers from.

* * *

## Running Containers: Interactive and Detached

An image is inert until you run it. Let's create containers and see them become alive.

### Run Python Interactively (Interactive Mode)

```
docker run -it python:3.12-slim python
```

**Output:**

```
Python 3.12.1 (main, Dec 19 2024, 19:52:33) [GCC 12.2.0] on linuxType "help", "copyright", "credits" or "license" for more information.>>>
```

What happened:

-   `-i` (interactive): Keeps STDIN open even if not attached
-   `-t` (tty): Allocates a pseudo-terminal
-   Together (`-it`): You can type commands and see output

You're now inside a Python REPL running in a container. Try:

```
>>> print("Hello from inside a container!")Hello from inside a container!>>> exit()
```

When you exit, the container stops. The image remains unchanged.

### Run Nginx in Background (Detached Mode)

Running a web server in interactive mode would block your terminal. Instead, run it detached:

```
docker run -d --name web-server -p 8080:80 nginx:alpine
```

**Output:**

```
c7d9e4a6f5b2a1c8d3e9f4a6b5c2d1e0
```

What happened:

-   `-d` (detached): Run in background
-   `--name web-server`: Give the container a readable name
-   `-p 8080:80`: Map port 8080 on your machine to port 80 in the container

The container is now running. Test it:

```
curl http://localhost:8080
```

**Output:**

```
<!DOCTYPE html><html><head><title>Welcome to nginx!</title><style>    body {        width: 35em;        margin: 0 auto;        font-family: Tahoma, Verdana, Arial, sans-serif;    }</style></head><body><h1>Welcome to nginx!</h1>...
```

The Nginx container is serving web traffic. Perfect.

* * *

## Container Lifecycle: Inspect, Stop, Restart, Remove

Containers have a lifecycle. Let's see all the operations:

### List Running Containers

```
docker ps
```

**Output:**

```
CONTAINER ID   IMAGE           COMMAND                  CREATED        STATUS       PORTS                  NAMESc7d9e4a6f5b2   nginx:alpine    "/docker-entrypoint.…"   2 minutes ago  Up 2 mins    0.0.0.0:8080->80/tcp   web-server
```

Only running containers appear. The Python container we exited is gone (it stopped when we exited Python).

### List All Containers (Including Stopped)

```
docker ps -a
```

**Output:**

```
CONTAINER ID   IMAGE              COMMAND               CREATED         STATUS                     PORTS     NAMESc7d9e4a6f5b2   nginx:alpine       "/docker-entrypoint.…"   5 minutes ago   Up 5 minutes               8080->80  web-serverf2e1d9c8b7a6   python:3.12-slim   "python"              10 minutes ago  Exited (0) 8 minutes ago            practical_archimedes
```

The Python container still exists (in stopped state) but won't restart automatically.

### Stop a Running Container

```
docker stop web-server
```

**Output:**

```
web-server
```

The container gracefully stops. Test that the web server no longer responds:

```
curl http://localhost:8080
```

**Output:**

```
curl: (7) Failed to connect to localhost port 8080: Connection refused
```

### Start a Stopped Container

```
docker start web-server
```

**Output:**

```
web-server
```

The container restarts. Test the web server again:

```
curl http://localhost:8080
```

**Output:**

```
<!DOCTYPE html><html>...
```

Running again.

### Remove a Container

```
docker rm web-server
```

**Output:**

```
Error response from daemon: You cannot remove a running container. Stop the container before removing or force remove with option '-f'.
```

Right—can't delete a running container. Stop it first:

```
docker stop web-serverdocker rm web-server
```

**Output:**

```
web-serverweb-server
```

The container is completely deleted. Its file system, networking, and state are gone.

* * *

## Execute Commands Inside Containers

Sometimes you need to run commands inside a running container without stopping it.

Start Nginx again:

```
docker run -d --name web-server -p 8080:80 nginx:alpine
```

Now execute a command inside it:

```
docker exec web-server ls /usr/share/nginx/html/
```

**Output:**

```
50x.htmlindex.html
```

You're listing the directory where Nginx serves files, all from inside the running container.

### Access a Shell Inside the Container

```
docker exec -it web-server sh
```

**Output:**

```
/ #
```

You now have a shell prompt inside the Nginx container. Try:

```
# cat /etc/os-release
```

**Output:**

```
NAME="Alpine Linux"ID=alpineVERSION_ID=3.18.4PRETTY_NAME="Alpine Linux v3.18.4"HOME_URL="https://alpinelinux.org/"BUG_REPORT_URL="https://bugs.alpinelinux.org/issues"
```

You're running Alpine Linux inside the container. Exit:

```
# exit
```

* * *

## Understanding Layers: How Images Are Built

Images aren't monolithic blobs. They're built from **layers**, stacked like cake layers.

### Inspect Image Layers

```
docker inspect nginx:alpine
```

**Output (abbreviated):**

```
[  {    "Id": "sha256:f5ae1a5d5c8b...",    "RepoTags": ["nginx:alpine"],    "RepoDigests": ["nginx@sha256:a8a6..."],    "Size": 41203456,    "VirtualSize": 41203456,    "Layers": [      "sha256:a803e7c4b030...",      "sha256:8c2be06b0893...",      "sha256:68b0f6f0e0d6...",      "sha256:2b3f1a6c8d9e..."    ]  }]
```

An Nginx image might have 4-5 layers:

1.  Base OS (Alpine Linux)
2.  Package manager updates
3.  Nginx installation
4.  Configuration files
5.  Entrypoint script

Each layer is **independent** and **reusable**. If you create multiple images that share the same base OS layer, Docker only stores that layer once on disk.

### Why Layers Matter

Layers enable:

**Caching**: When you rebuild an image, Docker reuses unchanged layers (super fast)

**Sharing**: Multiple images sharing a base layer means only one copy on disk

**Efficiency**: You only download layers that don't exist locally (pull is fast)

**Auditability**: Each layer has a hash you can verify

When you write a Dockerfile (later), each instruction creates a layer. Understanding layers helps you optimize image size and build speed.

* * *

## Try With AI

You now have the foundational understanding. Use AI to deepen your hands-on exploration.

### Setup

You have Docker running. Open a terminal with:

-   Docker Desktop running
-   Python and Nginx images already pulled (from earlier)

### Prompt 1: Explore Layer Differences

```
I have two images: python:3.12-slim and nginx:alpine. How can I comparetheir layers using docker inspect? What do the layers tell me about whatsoftware is installed in each?
```

**What you're learning**: Docker's layer architecture reveals how images are constructed. By comparing layer counts and sizes, you can understand why Python images are larger (more dependencies) and how base images (Alpine) get reused across different applications.

### Prompt 2: Verify Container Independence

```
I'm running two Nginx containers from the same image on the same machine.Show me how to verify they're independent. If I create a file in onecontainer's file system, does it affect the other?
```

**What you're learning**: Container isolation in practice. You'll see that each container has its own writable layer, so changes in one never affect another—even when they share the same image. This is the foundation of reproducible deployments.

### Prompt 3: Investigate Container State

```
I have a container that exited. Can I see what command it ran beforeexiting? Can I see its logs? How would I know why it stopped?
```

**What you're learning**: Container forensics. You'll use `docker logs`, `docker inspect`, and exit codes to understand container behavior. This is essential for debugging containers that fail in production.

### Safety Note

Remember that container commands (`docker rm`, `docker rmi`) are destructive. Always double-check container names before removing. In production, use `docker rm` with caution—stopped containers may contain logs or state you need to investigate.

* * *

## Reflect on Your Skill

You built a `docker-deployment` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my docker-deployment skill, explain the difference between images and containers.Does my skill correctly distinguish between immutable templates and running instances?
```

### Identify Gaps

Ask yourself:

-   Did my skill include the images vs containers distinction?
-   Did it handle layer architecture and copy-on-write concepts?

### Improve Your Skill

If you found gaps:

```
My docker-deployment skill is missing fundamental concepts about images and containers.Update it to include the image/container relationship, layer architecture, and copy-on-write mechanisms.
```

* * *

Checking access...

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 49: Docker for AI Services](/docs/AI-Cloud-Native-Development/docker-for-ai-services)
-   Writing Your First Dockerfile

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/49-docker-for-ai-services/03-writing-your-first-dockerfile.md)

# Writing Your First Dockerfile

In Lesson 2, you pulled images from Docker Hub and ran containers. Those images were built by someone else. Now you'll write your own blueprint—a Dockerfile—and build a custom image for your Task API.

By the end of this lesson, you'll understand exactly what happens when Docker reads each line of your Dockerfile, why instruction order matters for build speed, and how to create images that build fast and run reliably.

* * *

## Setup: Create the Task API Project

You'll containerize the In-Memory Task API from Chapter 40. Let's create it fresh using UV:

```
uv init task-api && cd task-api
```

**Output:**

```
Initialized project `task-api` at `/Users/you/task-api`
```

Add FastAPI with all standard dependencies:

```
uv add "fastapi[standard]"
```

**Output:**

```
Resolved 23 packages in 156msPrepared 23 packages in 1.2sInstalled 23 packages in 89ms + annotated-types==0.7.0 + anyio==4.7.0 + click==8.1.8 + fastapi==0.115.6 + uvicorn==0.34.0 ...
```

Now replace the contents of `main.py` with the Task API:

```
from fastapi import FastAPI, HTTPExceptionfrom pydantic import BaseModelapp = FastAPI(title="Task API")class Task(BaseModel):    id: int | None = None    title: str    completed: bool = Falsetasks: list[Task] = []next_id = 1@app.post("/tasks", response_model=Task)def create_task(task: Task) -> Task:    global next_id    task.id = next_id    next_id += 1    tasks.append(task)    return task@app.get("/tasks", response_model=list[Task])def list_tasks() -> list[Task]:    return tasks@app.get("/tasks/{task_id}", response_model=Task)def get_task(task_id: int) -> Task:    for task in tasks:        if task.id == task_id:            return task    raise HTTPException(status_code=404, detail="Task not found")@app.get("/health")def health_check() -> dict:    return {"status": "healthy"}
```

Test that it runs locally:

```
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

**Output:**

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

Open a new terminal and verify:

```
curl http://localhost:8000/health
```

**Output:**

```
{"status":"healthy"}
```

Stop the server with `Ctrl+C`. Your API works locally—now let's containerize it.

* * *

## What Is a Dockerfile?

A Dockerfile is a **text file containing instructions** that tell Docker how to build an image. Think of it as a recipe:

-   A **recipe** lists ingredients and steps to make a dish
-   A **Dockerfile** lists a base environment and steps to create an image

When you run `docker build`, Docker reads your Dockerfile line by line, executing each instruction to construct an image.

### What a Dockerfile Produces

```
Dockerfile (your instructions)        ↓    docker build        ↓    Image (frozen environment)        ↓    docker run        ↓    Container (running instance)
```

The Dockerfile doesn't run your application. It creates an **image**—a frozen snapshot containing your code, dependencies, and configuration. When you `docker run` that image, you get a live container.

### How Docker Reads a Dockerfile

Docker processes your Dockerfile **top to bottom**, one instruction at a time:

1.  Each instruction creates a **layer** (a snapshot of the filesystem at that point)
2.  Layers stack on top of each other
3.  The final stack of layers = your image
4.  Docker caches layers—if an instruction hasn't changed, Docker reuses the cached layer

This layered approach is why Docker builds are fast after the first time: unchanged layers don't rebuild.

### The Six Essential Instructions

Instruction

Purpose

`FROM`

Start from a base image (the foundation)

`WORKDIR`

Set the working directory inside the container

`COPY`

Copy files from your machine into the image

`RUN`

Execute a command during build (install packages)

`EXPOSE`

Document which port the application uses

`CMD`

Define the default command when container starts

You'll use all six in your Dockerfile. Let's write it instruction by instruction.

* * *

## Writing the Dockerfile: Line by Line

Create a new file named `Dockerfile` (no extension):

```
touch Dockerfile
```

Open it in your editor. We'll build it one instruction at a time.

### Instruction 1: FROM

Every Dockerfile starts with `FROM`. This specifies your **base image**—the starting environment.

Add this line:

```
FROM python:3.12-slim
```

**What this does:**

-   `FROM` tells Docker: "Start with this pre-built image"
-   `python:3.12-slim` is an official Python image with minimal OS (~130 MB)
-   The image comes from Docker Hub (where you pulled `nginx:alpine` in Lesson 2)

**Why `slim`?** The `slim` variant includes only what's needed to run Python. The full `python:3.12` image is ~900 MB with build tools you don't need for this application.

Your Dockerfile so far:

```
FROM python:3.12-slim
```

### Instruction 2: Install UV Package Manager

UV is a modern Python package manager—10-100x faster than pip. We'll copy it from its official image:

```
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
```

**What this does:**

-   `COPY --from=` is a multi-stage copy—it pulls binaries from another image
-   `ghcr.io/astral-sh/uv:latest` is UV's official image
-   `/uv` and `/uvx` are the UV binaries
-   `/bin/` places them in the system PATH

Your Dockerfile so far:

```
FROM python:3.12-slimCOPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
```

### Instruction 3: WORKDIR

Set where your application will live inside the container:

```
WORKDIR /app
```

**What this does:**

-   Creates `/app` directory if it doesn't exist
-   Sets it as the working directory for all subsequent instructions
-   All `COPY` and `RUN` commands now execute relative to `/app`

Your Dockerfile so far:

```
FROM python:3.12-slimCOPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/WORKDIR /app
```

### Instruction 4: COPY Dependencies

Copy your dependency file into the image:

```
COPY pyproject.toml .
```

**What this does:**

-   Copies `pyproject.toml` from your machine (the build context)
-   Places it in `/app` (current WORKDIR)
-   The `.` means "current directory inside the container"

**Why copy this first?** Layer caching. Dependencies change rarely; code changes often. By copying dependencies first, Docker can cache the installed packages layer and reuse it when only your code changes.

Your Dockerfile so far:

```
FROM python:3.12-slimCOPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/WORKDIR /appCOPY pyproject.toml .
```

### Instruction 5: RUN (Install Packages)

Now install the dependencies:

```
RUN uv sync --no-dev
```

**What this does:**

-   `RUN` executes a command **during image build**
-   `uv sync` reads `pyproject.toml` and installs all dependencies
-   `--no-dev` skips development dependencies (pytest, mypy, etc.)
-   Creates a layer containing all installed packages

**Important distinction:**

-   `RUN` executes during **build** (creates a layer in the image)
-   `CMD` executes when **container starts** (doesn't create a layer)

Your Dockerfile so far:

```
FROM python:3.12-slimCOPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/WORKDIR /appCOPY pyproject.toml .RUN uv sync --no-dev
```

### Instruction 6: COPY Application Code

Now copy your actual application:

```
COPY main.py .
```

**What this does:**

-   Copies `main.py` into `/app`
-   This is the code that changes frequently

**Why copy this AFTER dependencies?** When you edit `main.py` and rebuild:

1.  Docker sees that `pyproject.toml` hasn't changed
2.  Docker reuses the cached layer with installed packages
3.  Only this `COPY main.py` layer rebuilds
4.  **Build time: ~1 second** instead of 30+ seconds

Your Dockerfile so far:

```
FROM python:3.12-slimCOPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/WORKDIR /appCOPY pyproject.toml .RUN uv sync --no-devCOPY main.py .
```

### Instruction 7: EXPOSE

Document which port your application uses:

```
EXPOSE 8000
```

**What this does:**

-   Documents that the container listens on port 8000
-   Does NOT actually open the port—that happens with `-p` at runtime
-   Useful as documentation and for orchestrators like Kubernetes

Your Dockerfile so far:

```
FROM python:3.12-slimCOPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/WORKDIR /appCOPY pyproject.toml .RUN uv sync --no-devCOPY main.py .EXPOSE 8000
```

### Instruction 8: CMD

Finally, tell Docker what command to run when the container starts:

```
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**What this does:**

-   `CMD` specifies the default startup command
-   `uv run` executes in the UV-managed environment
-   `uvicorn main:app` starts the ASGI server with your FastAPI app
-   `--host 0.0.0.0` binds to all interfaces (required for container networking)
-   `--port 8000` matches the EXPOSE instruction

**Why `0.0.0.0`?** Inside a container, `localhost` (127.0.0.1) is isolated. Using `0.0.0.0` makes the service accessible when you map ports with `-p`.

### Complete Dockerfile

```
FROM python:3.12-slimCOPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/WORKDIR /appCOPY pyproject.toml .RUN uv sync --no-devCOPY main.py .EXPOSE 8000CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Save the file.

* * *

## Building Your Image

Now build an image from your Dockerfile:

```
docker build -t task-api:v1 .
```

**What the flags mean:**

-   `docker build` reads the Dockerfile and builds an image
-   `-t task-api:v1` tags the image with name `task-api` and version `v1`
-   `.` specifies the build context (current directory)

**Output:**

```
[+] Building 45.2s (10/10) FINISHED => [internal] load build definition from Dockerfile => [internal] load .dockerignore => [1/5] FROM docker.io/library/python:3.12-slim => [2/5] COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/ => [3/5] WORKDIR /app => [4/5] COPY pyproject.toml . => [5/5] RUN uv sync --no-devResolved 23 packages in 89msInstalled 23 packages in 156ms + fastapi==0.115.6 + uvicorn==0.34.0 ... => [6/5] COPY main.py . => exporting to image => => naming to docker.io/library/task-api:v1
```

Notice each step corresponds to an instruction in your Dockerfile. Docker executed them top to bottom, creating layers.

Verify the image exists:

```
docker images | grep task-api
```

**Output:**

```
task-api    v1    a1b2c3d4e5f6    30 seconds ago    195MB
```

Your image is ~195 MB—containing Python, UV, FastAPI, Uvicorn, and your application code.

* * *

## Running Your Container

Start a container from your image:

```
docker run -p 8000:8000 task-api:v1
```

**What `-p 8000:8000` does:**

-   Maps port 8000 on your machine (left) to port 8000 in the container (right)
-   Your machine's port 8000 → container's port 8000
-   Now `localhost:8000` on your machine reaches the container

**Output:**

```
INFO:     Started server process [1]INFO:     Waiting for application startup.INFO:     Application startup complete.INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

Open a **new terminal** and test:

```
curl http://localhost:8000/health
```

**Output:**

```
{"status":"healthy"}
```

Create a task:

```
curl -X POST http://localhost:8000/tasks \  -H "Content-Type: application/json" \  -d '{"title": "Learn Docker"}'
```

**Output:**

```
{"id":1,"title":"Learn Docker","completed":false}
```

Your containerized Task API works! Stop it with `Ctrl+C`.

* * *

## The .dockerignore File

When you run `docker build .`, Docker sends your entire directory to the build context. If you have:

-   `.venv/` (500+ MB virtual environment)
-   `__pycache__/` (bytecode)
-   `.git/` (repository history)
-   `.env` (secrets)

Docker wastes time processing these, and worse—secrets could end up in your image.

Create `.dockerignore`:

```
# Python artifacts__pycache__/*.py[cod]*.egg-info/dist/build/# Virtual environments.venv/venv/# UV cache.uv/# IDE files.idea/.vscode/# Git.git/.gitignore# Secrets.env.env.**.pem*.key# OS files.DS_Store
```

Rebuild to verify it works:

```
docker build -t task-api:v2 .
```

The build should be faster since Docker isn't processing excluded files.

* * *

## Layer Caching in Action

Edit `main.py` to add a version endpoint:

```
@app.get("/version")def get_version() -> dict:    return {"version": "1.0.0"}
```

Rebuild:

```
docker build -t task-api:v3 .
```

**Output:**

```
[+] Building 1.2s (10/10) FINISHED => CACHED [1/5] FROM docker.io/library/python:3.12-slim => CACHED [2/5] COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/ => CACHED [3/5] WORKDIR /app => CACHED [4/5] COPY pyproject.toml . => CACHED [5/5] RUN uv sync --no-dev => [6/5] COPY main.py . => exporting to image
```

Notice `CACHED` for steps 1-5. Docker reused those layers because `pyproject.toml` didn't change. Only the `COPY main.py` step ran.

**Build time: ~1 second** instead of 45 seconds.

This is why instruction order matters:

-   **Frequent changes** (your code) go at the **bottom**
-   **Rare changes** (dependencies) go near the **top**

* * *

## Running with Options

### Different Host Port

Run on port 9000 instead:

```
docker run -p 9000:8000 task-api:v3
```

Test:

```
curl http://localhost:9000/health
```

### Environment Variables

Pass configuration without changing the image:

```
docker run -p 8000:8000 -e LOG_LEVEL=debug task-api:v3
```

Your application reads `os.environ["LOG_LEVEL"]` at runtime.

### Background Mode

Run without blocking your terminal:

```
docker run -d -p 8000:8000 --name my-api task-api:v3
```

**Flags:**

-   `-d` runs detached (background)
-   `--name my-api` gives it a memorable name

Check status:

```
docker ps
```

Stop and remove:

```
docker stop my-api && docker rm my-api
```

* * *

## Common Build Errors

### "COPY: source file does not exist"

```
COPY pyproject.toml .COPY: source file does not exist
```

**Cause:** File missing in build context. **Fix:** Verify the file exists: `ls pyproject.toml`

### "Port already in use"

```
Bind for 0.0.0.0:8000 failed: port is already allocated
```

**Cause:** Another process using port 8000. **Fix:** Use different port: `docker run -p 9000:8000 task-api:v1`

### Container Exits Immediately

Run without `-d` to see the error:

```
docker run task-api:v1
```

Or check logs:

```
docker logs $(docker ps -lq)
```

* * *

## Try With AI

### Prompt 1: Diagnose a Slow Build

```
My Docker builds take 60 seconds every time I change my code. Here's myDockerfile:FROM python:3.12-slimWORKDIR /appCOPY . .RUN pip install -r requirements.txtCMD ["python", "main.py"]What's wrong with my layer ordering? How would you fix it?
```

**What you're learning:** Analyzing layer cache invalidation—understanding how instruction order affects build performance.

### Prompt 2: Handle Build Dependencies

```
My Dockerfile build fails with:error: Failed to build `pydantic-core==2.27.2`  Caused by: Failed to build wheelThe package needs a Rust compiler. I'm using python:3.12-slim. What are myoptions? Should I use a larger base image or try multi-stage builds?
```

**What you're learning:** Troubleshooting native compilation failures—a common challenge with Python packages that have binary dependencies.

### Prompt 3: Design for Your Own API

```
I'm building a [describe your API]. Based on the Task API Dockerfile pattern,help me design my Dockerfile. Ask me:1. What dependencies does it need?2. Does it require any system packages?3. What environment variables does it use?4. Does it need to persist data?Then write a Dockerfile with comments explaining each choice.
```

**What you're learning:** Applying Dockerfile patterns to your own applications—moving from following instructions to making design decisions.

### Safety Note

Never include secrets (API keys, passwords, database credentials) in your Dockerfile or image. Use environment variables (`-e` flag) or Docker secrets at runtime. Images may be shared or pushed to registries where secrets would be exposed.

* * *

## Reflect on Your Skill

You built a `docker-deployment` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my docker-deployment skill, generate a Dockerfile for a FastAPIapplication. Does it:1. Use proper instruction ordering for layer caching?2. Include UV for fast package installation?3. Set WORKDIR and use 0.0.0.0 for the host?
```

### Identify Gaps

-   Did your skill produce valid Dockerfiles?
-   Did it handle layer caching correctly?
-   Did it include .dockerignore patterns?

### Improve Your Skill

If you found gaps:

```
My docker-deployment skill needs better Dockerfile generation. Update it to:1. Order instructions for optimal layer caching2. Use UV instead of pip3. Generate .dockerignore files4. Document each instruction with comments
```

* * *

Checking access...

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 49: Docker for AI Services](/docs/AI-Cloud-Native-Development/docker-for-ai-services)
-   Container Lifecycle and Debugging

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/49-docker-for-ai-services/04-container-lifecycle-and-debugging.md)

# Container Lifecycle and Debugging

Your FastAPI service from Lesson 3 is running in a container. It responds to requests, returns JSON, and everything works. Then you deploy it to a server. It crashes. No error on your screen, no stack trace, nothing. The container simply stops.

This is where container debugging skills become essential. Unlike local development where errors appear in your terminal, containerized applications fail silently unless you know where to look. The container's logs, its internal state, its configuration, and its resource usage are all hidden behind Docker's abstraction layer.

In this lesson, you'll learn the debugging toolkit that every container developer needs: reading logs to understand what happened, executing commands inside containers to inspect their state, and using inspection tools to verify configuration. You'll practice these skills using the FastAPI application you built in Lesson 3, intentionally breaking it to develop debugging intuition.

* * *

## Running Your FastAPI App in Detached Mode

Before debugging, let's run your Lesson 3 FastAPI container in the background. Navigate to your `task-api` directory from Lesson 3:

```
cd task-apidocker build -t task-api:v1 .
```

**Output:**

```
$ docker build -t task-api:v1 .[+] Building 2.1s (8/8) FINISHED => [1/5] FROM docker.io/library/python:3.12-slim => CACHED [2/5] WORKDIR /app => CACHED [3/5] COPY requirements.txt . => CACHED [4/5] RUN pip install --no-cache-dir -r requirements.txt => CACHED [5/5] COPY main.py . => exporting to imageSuccessfully tagged task-api:v1
```

Now run it in detached mode (`-d`) so it runs in the background:

```
docker run -d -p 8000:8000 --name task-api task-api:v1
```

**Output:**

```
$ docker run -d -p 8000:8000 --name task-api task-api:v1a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6
```

The long string is the container ID. The `-d` flag means "detached"—the container runs in the background and you get your terminal back.

Verify the container is running:

```
docker ps
```

**Output:**

```
$ docker psCONTAINER ID   IMAGE         COMMAND                  STATUS         PORTS                    NAMESa7b8c9d0e1f2   task-api:v1   "uvicorn main:app ..."   Up 5 seconds   0.0.0.0:8000->8000/tcp   task-api
```

Test that it's responding:

```
curl http://localhost:8000/health
```

**Output:**

```
$ curl http://localhost:8000/health{"status":"healthy"}
```

Now you have a running container to debug. Let's explore the debugging tools.

* * *

## Reading Container Logs

The most important debugging command is `docker logs`. It shows everything your application writes to stdout and stderr—print statements, uvicorn startup messages, errors, and stack traces.

View logs from your running container:

```
docker logs task-api
```

**Output:**

```
$ docker logs task-apiINFO:     Started server process [1]INFO:     Waiting for application startup.INFO:     Application startup complete.INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

These logs show uvicorn started successfully. Now make a request and check logs again:

```
curl http://localhost:8000/docker logs task-api
```

**Output:**

```
$ curl http://localhost:8000/{"message":"Hello from Docker!"}$ docker logs task-apiINFO:     Started server process [1]INFO:     Waiting for application startup.INFO:     Application startup complete.INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)INFO:     172.17.0.1:54321 - "GET / HTTP/1.1" 200 OK
```

The new log line shows the request: the client IP, the endpoint accessed, and the HTTP response code (200 OK).

### Following Logs in Real-Time

For live debugging, use the `-f` (follow) flag to stream logs continuously:

```
docker logs -f task-api
```

**Output:**

```
$ docker logs -f task-apiINFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)INFO:     172.17.0.1:54321 - "GET / HTTP/1.1" 200 OK[cursor waiting for new logs...]
```

Now in another terminal, make requests and watch them appear in real-time. Press Ctrl+C to stop following.

### Viewing Recent Logs

For large log files, use `--tail` to see only the last N lines:

```
docker logs --tail 5 task-api
```

**Output:**

```
$ docker logs --tail 5 task-apiINFO:     Application startup complete.INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)INFO:     172.17.0.1:54321 - "GET / HTTP/1.1" 200 OKINFO:     172.17.0.1:54322 - "GET /health HTTP/1.1" 200 OK
```

* * *

## Debugging a Failed Container

Now let's create a container that fails on startup. Stop and remove the current container:

```
docker stop task-apidocker rm task-api
```

**Output:**

```
$ docker stop task-apitask-api$ docker rm task-apitask-api
```

Create a Python script that simulates a startup failure. Create `broken_main.py`:

```
import osimport sysprint("Task API starting...")print("Checking for required configuration...")# Simulate missing required environment variableapi_key = os.environ.get("API_KEY")if not api_key:    print("ERROR: API_KEY environment variable is required but not set")    sys.exit(1)print(f"API_KEY configured: {api_key[:4]}****")print("Starting server...")
```

Create a Dockerfile for this broken app. Create `Dockerfile.broken`:

```
FROM python:3.12-slimWORKDIR /appCOPY broken_main.py .CMD ["python", "broken_main.py"]
```

Build and run it:

```
docker build -f Dockerfile.broken -t task-api-broken:v1 .docker run -d --name broken-api task-api-broken:v1
```

**Output:**

```
$ docker build -f Dockerfile.broken -t task-api-broken:v1 .[+] Building 1.2s (7/7) FINISHEDSuccessfully tagged task-api-broken:v1$ docker run -d --name broken-api task-api-broken:v1b1c2d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0
```

Check if it's running:

```
docker ps
```

**Output:**

```
$ docker psCONTAINER ID   IMAGE   COMMAND   STATUS   PORTS   NAMES
```

Empty! The container isn't running. Check all containers, including stopped ones:

```
docker ps -a
```

**Output:**

```
$ docker ps -aCONTAINER ID   IMAGE                 COMMAND                  STATUS                     NAMESb1c2d3e4f5g6   task-api-broken:v1    "python broken_main..."  Exited (1) 5 seconds ago   broken-api
```

Status shows "Exited (1)" - the container crashed with exit code 1. Now use `docker logs` to find out why:

```
docker logs broken-api
```

**Output:**

```
$ docker logs broken-apiTask API starting...Checking for required configuration...ERROR: API_KEY environment variable is required but not set
```

The logs tell you exactly what went wrong: the API\_KEY environment variable is missing.

### Fixing the Broken Container

Now that you know the problem, run it correctly with the environment variable:

```
docker rm broken-apidocker run -d --name broken-api -e API_KEY=sk-test-12345 task-api-broken:v1docker logs broken-api
```

**Output:**

```
$ docker rm broken-apibroken-api$ docker run -d --name broken-api -e API_KEY=sk-test-12345 task-api-broken:v1c2d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1$ docker logs broken-apiTask API starting...Checking for required configuration...API_KEY configured: sk-t****Starting server...
```

The container now starts successfully because the required environment variable is set.

* * *

## Executing Commands Inside Containers

Logs show what happened, but sometimes you need to inspect the container's current state. `docker exec` lets you run commands inside a running container.

First, restart your working FastAPI container:

```
docker rm -f broken-apidocker run -d -p 8000:8000 --name task-api task-api:v1
```

**Output:**

```
$ docker rm -f broken-apibroken-api$ docker run -d -p 8000:8000 --name task-api task-api:v1d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2
```

Now execute commands inside the running container:

```
docker exec task-api pwd
```

**Output:**

```
$ docker exec task-api pwd/app
```

The container's working directory is `/app`, as set by WORKDIR in the Dockerfile.

List files in the container:

```
docker exec task-api ls -la
```

**Output:**

```
$ docker exec task-api ls -latotal 16drwxr-xr-x 1 root root 4096 Dec 22 10:30 .drwxr-xr-x 1 root root 4096 Dec 22 10:30 ..-rw-r--r-- 1 root root  237 Dec 22 10:30 main.py-rw-r--r-- 1 root root   42 Dec 22 10:30 requirements.txt
```

Check what user is running the process:

```
docker exec task-api whoami
```

**Output:**

```
$ docker exec task-api whoamiroot
```

### Interactive Shell Access

For deeper debugging, launch an interactive shell inside the container:

```
docker exec -it task-api sh
```

**Output:**

```
$ docker exec -it task-api sh#
```

The `-it` flags mean "interactive" and "allocate a TTY" (terminal). You're now inside the container. Try some commands:

```
# pwd/app# cat main.pyfrom fastapi import FastAPIapp = FastAPI()@app.get("/")def read_root():    return {"message": "Hello from Docker!"}@app.get("/health")def health_check():    return {"status": "healthy"}# exit
```

**Output:**

```
# pwd/app# cat main.pyfrom fastapi import FastAPI...# exit$
```

The `exit` command returns you to your host machine.

### Testing API Endpoints from Inside the Container

You can even test your API from inside the container:

```
docker exec task-api curl -s http://localhost:8000/health
```

**Output:**

```
$ docker exec task-api curl -s http://localhost:8000/health{"status":"healthy"}
```

This confirms the API is responding on port 8000 inside the container. If this works but external requests fail, you have a port mapping problem, not an application problem.

* * *

## Inspecting Container Configuration

The `docker inspect` command shows complete configuration and runtime state in JSON format. This is essential for verifying that a container was started with the correct settings.

Inspect your running container:

```
docker inspect task-api
```

This outputs hundreds of lines. Let's extract specific information.

### Check Container Status

```
docker inspect --format='{{.State.Status}}' task-api
```

**Output:**

```
$ docker inspect --format='{{.State.Status}}' task-apirunning
```

### Check the Running Command

```
docker inspect --format='{{json .Config.Cmd}}' task-api
```

**Output:**

```
$ docker inspect --format='{{json .Config.Cmd}}' task-api["uvicorn","main:app","--host","0.0.0.0","--port","8000"]
```

This confirms exactly what command the container is running.

### Check Environment Variables

```
docker inspect --format='{{json .Config.Env}}' task-api
```

**Output:**

```
$ docker inspect --format='{{json .Config.Env}}' task-api["PATH=/usr/local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin","LANG=C.UTF-8","GPG_KEY=...","PYTHON_VERSION=3.12.7","PYTHON_PIP_VERSION=24.0"]
```

### Check Port Mappings

```
docker inspect --format='{{json .NetworkSettings.Ports}}' task-api
```

**Output:**

```
$ docker inspect --format='{{json .NetworkSettings.Ports}}' task-api{"8000/tcp":[{"HostIp":"0.0.0.0","HostPort":"8000"}]}
```

This shows port 8000 in the container is mapped to port 8000 on the host.

### Practical Use: Verify Exit Codes

For crashed containers, inspect shows why they stopped:

```
docker inspect --format='{{.State.ExitCode}}' broken-api
```

**Output:**

```
$ docker inspect --format='{{.State.ExitCode}}' broken-api1
```

Exit code 1 means the application exited with an error. Exit code 0 means success. Exit code 137 means the kernel killed the process (usually out of memory).

* * *

## Resolving Port Conflicts

A common debugging scenario: you try to start a container and it fails because the port is already in use.

Try to start another container on port 8000 while `task-api` is running:

```
docker run -d -p 8000:8000 --name task-api-2 task-api:v1
```

**Output:**

```
$ docker run -d -p 8000:8000 --name task-api-2 task-api:v1docker: Error response from daemon: driver failed programming external connectivityon endpoint task-api-2: Bind for 0.0.0.0:8000 failed: port is already allocated.
```

The error is clear: port 8000 is already allocated (by your first container).

### Solution 1: Use a Different Host Port

```
docker run -d -p 8001:8000 --name task-api-2 task-api:v1
```

**Output:**

```
$ docker run -d -p 8001:8000 --name task-api-2 task-api:v1e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3
```

Now you have two containers:

-   `task-api` on port 8000
-   `task-api-2` on port 8001

Verify both work:

```
curl http://localhost:8000/healthcurl http://localhost:8001/health
```

**Output:**

```
$ curl http://localhost:8000/health{"status":"healthy"}$ curl http://localhost:8001/health{"status":"healthy"}
```

### Solution 2: Find and Stop the Conflicting Container

If you need port 8000 specifically, find what's using it:

```
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

**Output:**

```
$ docker ps --format "table {{.Names}}\t{{.Ports}}"NAMES        PORTStask-api-2   0.0.0.0:8001->8000/tcptask-api     0.0.0.0:8000->8000/tcp
```

Stop the container using your desired port:

```
docker stop task-apidocker rm task-api
```

Now you can start a new container on port 8000.

Clean up for the next section:

```
docker stop task-api-2docker rm task-api-2
```

* * *

## Restart Policies for Resilience

Containers can crash due to bugs, resource exhaustion, or temporary failures. Instead of manually restarting them, configure Docker to restart them automatically.

### The `--restart` Flag

Docker supports several restart policies:

Policy

Behavior

`no`

Never restart (default)

`always`

Always restart, even after successful exit

`unless-stopped`

Restart unless manually stopped

`on-failure:N`

Restart only on non-zero exit, up to N times

### Testing Restart Policies

Create a container that crashes sometimes. Create `flaky_main.py`:

```
import randomimport sysimport timeprint("Task API starting...")time.sleep(1)if random.random() < 0.3:    print("ERROR: Random failure occurred!")    sys.exit(1)print("Task API started successfully!")while True:    time.sleep(10)
```

Build it:

```
docker build -f Dockerfile.broken -t flaky-api:v1 .
```

Wait, that Dockerfile won't work for this script. Create `Dockerfile.flaky`:

```
FROM python:3.12-slimWORKDIR /appCOPY flaky_main.py .CMD ["python", "-u", "flaky_main.py"]
```

The `-u` flag means unbuffered output so logs appear immediately.

```
docker build -f Dockerfile.flaky -t flaky-api:v1 .
```

**Output:**

```
$ docker build -f Dockerfile.flaky -t flaky-api:v1 .[+] Building 0.8s (7/7) FINISHEDSuccessfully tagged flaky-api:v1
```

Run without restart policy:

```
docker run -d --name flaky-no-restart flaky-api:v1sleep 3docker ps -a --filter name=flaky
```

**Output:**

```
$ docker ps -a --filter name=flakyCONTAINER ID   IMAGE          STATUS                     NAMESf5g6h7i8j9k0   flaky-api:v1   Exited (1) 2 seconds ago   flaky-no-restart
```

If the container crashed (30% chance), it stays dead. Remove it:

```
docker rm flaky-no-restart
```

Now run with automatic restart:

```
docker run -d --restart=unless-stopped --name flaky-restart flaky-api:v1
```

Watch it recover from failures:

```
docker logs -f flaky-restart
```

**Output (if it fails and restarts):**

```
$ docker logs -f flaky-restartTask API starting...ERROR: Random failure occurred!Task API starting...Task API started successfully!
```

The container automatically restarted after the failure. Check restart count:

```
docker inspect --format='{{.RestartCount}}' flaky-restart
```

**Output:**

```
$ docker inspect --format='{{.RestartCount}}' flaky-restart1
```

### Production Recommendation

For production services, use `--restart=unless-stopped`. This ensures:

-   Containers restart after crashes
-   Containers restart after host reboots
-   You can still manually stop them with `docker stop`

Clean up:

```
docker stop flaky-restartdocker rm flaky-restart
```

* * *

## Try With AI

Now that you understand container debugging fundamentals, practice these skills with increasingly complex scenarios.

**Prompt 1: Diagnose a Startup Failure**

Create a FastAPI application that requires a DATABASE\_URL environment variable. Run it without the variable and use the debugging tools you learned to identify the problem:

```
Create a FastAPI app that:1. Checks for DATABASE_URL environment variable on startup2. Prints an error and exits with code 1 if missing3. Prints "Connected to: [masked URL]" if presentHelp me create the Dockerfile and show me how to:- See the error when DATABASE_URL is missing- Verify the container exit code- Run it successfully with the environment variable
```

**What you're learning:** This reinforces the pattern of using `docker logs` and `docker inspect --format='{{.State.ExitCode}}'` to diagnose startup failures, and `-e` to provide environment variables.

**Prompt 2: Debug a Port Mapping Issue**

Sometimes your application seems to start but doesn't respond to requests. Practice debugging this:

```
My FastAPI container starts successfully (docker logs shows "Uvicorn running")but curl http://localhost:8000/ returns "Connection refused".Help me debug this using:1. docker inspect to check port mappings2. docker exec to test the app from inside the container3. Common causes of this problem
```

**What you're learning:** This teaches you to systematically isolate whether the problem is the application, the port mapping, or network configuration using `docker exec` to test from inside the container.

**Prompt 3: Configure a Resilient Service**

Production services need to handle crashes gracefully:

```
I have a FastAPI service that occasionally crashes due to memory pressure.Help me configure it with:1. --restart=unless-stopped for automatic recovery2. Memory limits to prevent runaway usage3. How to monitor restart countShow me the docker run command and how to verify the configuration.
```

**What you're learning:** This reinforces restart policies and introduces memory limits (`--memory`), which become critical when deploying AI services that can consume large amounts of RAM.

**Safety note:** When debugging containers in production, use read-only commands (`docker logs`, `docker inspect`) before interactive commands (`docker exec`). Avoid running shells in production containers unless absolutely necessary, as it can affect running services.

* * *

## Reflect on Your Skill

You built a `docker-deployment` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my docker-deployment skill, diagnose a failed container startup.Does my skill include debugging commands like docker logs, docker exec, and docker inspect?
```

### Identify Gaps

Ask yourself:

-   Did my skill include container lifecycle debugging techniques?
-   Did it handle restart policies and container forensics?

### Improve Your Skill

If you found gaps:

```
My docker-deployment skill is missing debugging and troubleshooting capabilities.Update it to include docker logs, docker exec, docker inspect usage, and restart policy configuration.
```

* * *

Checking access...

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 49: Docker for AI Services](/docs/AI-Cloud-Native-Development/docker-for-ai-services)
-   Multi-Stage Builds & Optimization

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/49-docker-for-ai-services/05-multi-stage-builds-and-optimization.md)

# Multi-Stage Builds & Optimization

Container images that work are good. Container images that work AND are small are great. This lesson teaches you why small images matter and how to achieve 70-85% size reduction through iterative optimization.

When you build a Docker image for a Python service, you typically need compilers and development libraries during the build process. But in production, you only need the installed packages themselves. A naive Dockerfile includes everything---build tools, development headers, cache files---adding hundreds of megabytes of unnecessary weight.

Multi-stage builds solve this elegantly. You perform dependency installation in a large build image, then copy only the artifacts you need into a minimal production image. Combined with UV (a Rust-based package manager that's 10-100x faster than pip) and Alpine base images, you can reduce a 1.2GB image to under 120MB.

In this lesson, you'll containerize a Task API service---the same pattern you'll use for your Part 6 FastAPI agent. You'll start with a bloated Dockerfile and progressively optimize it through four iterations, measuring the size reduction at each step.

* * *

## Setup: Create the Task API Project

Create a fresh project with UV (30 seconds):

```
uv init task-api-optimize && cd task-api-optimizeuv add "fastapi[standard]"
```

Now add your application code. Open `main.py` and replace its contents with:

```
from fastapi import FastAPI, HTTPExceptionfrom pydantic import BaseModelfrom datetime import datetimeapp = FastAPI(title="Task API", version="1.0.0")# In-memory task storage (production would use database)tasks: dict[str, dict] = {}class TaskCreate(BaseModel):    title: str    description: str | None = None    priority: int = 1class Task(BaseModel):    id: str    title: str    description: str | None    priority: int    created_at: datetime    completed: bool = False@app.get("/health")def health_check():    return {"status": "healthy", "service": "task-api"}@app.post("/tasks", response_model=Task)def create_task(task: TaskCreate):    task_id = f"task_{len(tasks) + 1}"    new_task = {        "id": task_id,        "title": task.title,        "description": task.description,        "priority": task.priority,        "created_at": datetime.now(),        "completed": False    }    tasks[task_id] = new_task    return new_task@app.get("/tasks")def list_tasks():    return list(tasks.values())@app.get("/tasks/{task_id}", response_model=Task)def get_task(task_id: str):    if task_id not in tasks:        raise HTTPException(status_code=404, detail="Task not found")    return tasks[task_id]@app.patch("/tasks/{task_id}/complete")def complete_task(task_id: str):    if task_id not in tasks:        raise HTTPException(status_code=404, detail="Task not found")    tasks[task_id]["completed"] = True    return tasks[task_id]
```

UV automatically created `pyproject.toml` with your dependencies. For Docker, we need a `requirements.txt`. Export it:

```
uv pip compile pyproject.toml -o requirements.txt
```

Verify your setup works:

```
uv run fastapi dev main.py
```

Visit `http://localhost:8000/health` to confirm the API responds. Press `Ctrl+C` to stop.

* * *

## Iteration 0: The Naive Dockerfile (~1.2GB)

Let's start with a Dockerfile that works but doesn't consider image size at all.

Create `Dockerfile.naive`:

```
FROM python:3.12WORKDIR /appCOPY requirements.txt .RUN pip install -r requirements.txtCOPY main.py .EXPOSE 8000CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build this image and check its size:

```
docker build -t task-api:naive -f Dockerfile.naive .
```

**Output:**

```
[+] Building 45.2s (9/9) FINISHED => [internal] load build definition from Dockerfile.naive           0.0s => [internal] load .dockerignore                                    0.0s => [internal] load metadata for docker.io/library/python:3.12       1.2s => [1/4] FROM docker.io/library/python:3.12                        28.3s => [2/4] WORKDIR /app                                               0.1s => [3/4] COPY requirements.txt .                                    0.0s => [4/4] RUN pip install -r requirements.txt                       12.8s => [5/5] COPY main.py .                                             0.0s => exporting to image                                               2.7s
```

Now check the image size:

```
docker images task-api:naive
```

**Output:**

```
REPOSITORY   TAG     IMAGE ID       CREATED          SIZEtask-api     naive   a1b2c3d4e5f6   15 seconds ago   1.21GB
```

**1.21GB for a simple Task API.** That bloat comes from:

Component

Approximate Size

Full Python image (compilers, headers, build tools)

~900MB

Pip cache (stored in `/root/.cache/pip`)

~150MB

Development dependencies

~150MB

None of that is needed to RUN the application. You only need the installed Python packages---maybe 100MB total.

* * *

## Iteration 1: Slim Base Image (~450MB)

The `python:3.12` image is the full-featured version. Docker provides leaner alternatives:

Base Image

Size

Contents

`python:3.12` (full)

~900MB

Build tools, compilers, development headers

`python:3.12-slim`

~150MB

Essential runtime, no build tools

`python:3.12-alpine`

~50MB

Minimal Linux, tiny footprint

`distroless/python3`

~50MB

Only runtime, no shell or package manager

Let's try slim first---it's the safest improvement with the least risk.

Create `Dockerfile.v1-slim`:

```
FROM python:3.12-slimWORKDIR /appCOPY requirements.txt .RUN pip install --no-cache-dir -r requirements.txtCOPY main.py .EXPOSE 8000CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Note: We added `--no-cache-dir` to pip to avoid storing the download cache.

Build and measure:

```
docker build -t task-api:slim -f Dockerfile.v1-slim .
```

**Output:**

```
[+] Building 18.4s (9/9) FINISHED => [internal] load metadata for docker.io/library/python:3.12-slim  0.8s => [1/4] FROM docker.io/library/python:3.12-slim                    8.2s => [4/4] RUN pip install --no-cache-dir -r requirements.txt         8.1s
```

```
docker images task-api:slim
```

**Output:**

```
REPOSITORY   TAG    IMAGE ID       CREATED          SIZEtask-api     slim   f6e5d4c3b2a1   8 seconds ago    458MB
```

Version

Size

Reduction

Naive

1.21GB

\---

Slim

458MB

62% smaller

**Progress: 62% reduction** from a single change (base image). But we're still carrying pip overhead and could do better.

* * *

## Iteration 2: Multi-Stage Build with UV (~180MB)

Multi-stage builds use multiple `FROM` instructions in a single Dockerfile. Each stage can use a different base image. You build dependencies in a large stage, then copy only what you need into a small stage.

We'll also introduce **UV**, a Rust-based Python package manager that's 10-100x faster than pip.

Create `Dockerfile.v2-multistage`:

```
# Stage 1: Build stage (install dependencies)FROM python:3.12-slim AS builderWORKDIR /app# Install UV package manager (10-100x faster than pip)RUN pip install uvCOPY requirements.txt .# UV installs packages to system Python# --system: install to system Python instead of virtual environment# --no-cache: don't store package cacheRUN uv pip install --system --no-cache -r requirements.txt# Stage 2: Runtime stage (only what's needed to run)FROM python:3.12-slimWORKDIR /app# Copy installed packages from builder stageCOPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packagesCOPY --from=builder /usr/local/bin /usr/local/bin# Set environment variablesENV PYTHONUNBUFFERED=1# Copy application codeCOPY main.py .EXPOSE 8000CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Let's understand what's happening:

**Stage 1 (builder)**:

-   Starts with `python:3.12-slim` (has pip available)
-   Installs UV package manager
-   Installs application dependencies with UV
-   This stage is used only for building; it's discarded when the build finishes

**Stage 2 (runtime)**:

-   Starts with a fresh `python:3.12-slim` (clean slate)
-   Copies only the installed packages from builder stage
-   Copies application code
-   Does NOT include UV, pip cache, or build artifacts
-   This is the final image Docker keeps

Build and measure:

```
docker build -t task-api:multistage -f Dockerfile.v2-multistage .
```

**Output:**

```
[+] Building 12.8s (14/14) FINISHED => [builder 1/4] FROM docker.io/library/python:3.12-slim             0.0s => [builder 2/4] RUN pip install uv                                  3.2s => [builder 3/4] COPY requirements.txt .                             0.0s => [builder 4/4] RUN uv pip install --system --no-cache ...          1.8s  <-- Much faster! => [stage-1 1/4] FROM docker.io/library/python:3.12-slim             0.0s => [stage-1 2/4] COPY --from=builder /usr/local/lib/python...        0.4s => [stage-1 3/4] COPY --from=builder /usr/local/bin ...              0.1s => [stage-1 4/4] COPY main.py .                                      0.0s
```

Notice how UV installed dependencies in 1.8 seconds vs pip's 8+ seconds.

```
docker images task-api:multistage
```

**Output:**

```
REPOSITORY   TAG          IMAGE ID       CREATED          SIZEtask-api     multistage   d3c2b1a0f9e8   5 seconds ago    182MB
```

Version

Size

Reduction from Naive

Naive

1.21GB

\---

Slim

458MB

62%

Multi-stage

182MB

85%

**Progress: 85% reduction.** The runtime image has no UV, no pip, no build tools---only the installed packages.

* * *

## Iteration 3: Alpine Base Image + UV (~120MB)

Alpine Linux is a minimal distribution (~5MB base) designed for containers. Combined with multi-stage builds and UV, we can achieve maximum size reduction.

Create `Dockerfile.v3-alpine`:

```
# Stage 1: Build stage with AlpineFROM python:3.12-alpine AS builderWORKDIR /app# Install UV package managerRUN pip install uvCOPY requirements.txt .# Install dependencies with UVRUN uv pip install --system --no-cache -r requirements.txt# Stage 2: Runtime stage with AlpineFROM python:3.12-alpineWORKDIR /app# Copy installed packages from builderCOPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packagesCOPY --from=builder /usr/local/bin /usr/local/binENV PYTHONUNBUFFERED=1COPY main.py .EXPOSE 8000CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and measure:

```
docker build -t task-api:alpine -f Dockerfile.v3-alpine .
```

**Output:**

```
[+] Building 15.2s (14/14) FINISHED => [builder 1/4] FROM docker.io/library/python:3.12-alpine           2.1s => [builder 2/4] RUN pip install uv                                  4.8s => [builder 3/4] COPY requirements.txt .                             0.0s => [builder 4/4] RUN uv pip install --system --no-cache ...          2.4s => [stage-1 1/4] FROM docker.io/library/python:3.12-alpine           0.0s => [stage-1 2/4] COPY --from=builder /usr/local/lib/python...        0.3s => [stage-1 3/4] COPY --from=builder /usr/local/bin ...              0.1s => [stage-1 4/4] COPY main.py .                                      0.0s
```

```
docker images task-api:alpine
```

**Output:**

```
REPOSITORY   TAG      IMAGE ID       CREATED          SIZEtask-api     alpine   e4f5a6b7c8d9   4 seconds ago    118MB
```

Version

Size

Reduction from Naive

Naive

1.21GB

\---

Slim

458MB

62%

Multi-stage

182MB

85%

Alpine + UV

118MB

**90%**

**Progress: 90% reduction.** From 1.21GB to 118MB.

* * *

## Iteration 4: Layer Optimization (~115MB)

Docker builds images in layers. Each `RUN` instruction creates a new layer. By combining commands and cleaning up in the same layer, we can squeeze out a few more megabytes.

Create `Dockerfile.v4-optimized`:

```
# Stage 1: Build stageFROM python:3.12-alpine AS builderWORKDIR /app# Single RUN: install UV + dependencies + cleanupRUN pip install uv && \    pip cache purgeCOPY requirements.txt .RUN uv pip install --system --no-cache -r requirements.txt && \    find /usr/local -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null || true && \    find /usr/local -type f -name '*.pyc' -delete 2>/dev/null || true# Stage 2: Runtime stageFROM python:3.12-alpineWORKDIR /app# Copy only necessary artifactsCOPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packagesCOPY --from=builder /usr/local/bin /usr/local/binENV PYTHONUNBUFFERED=1COPY main.py .EXPOSE 8000CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Optimizations applied:

-   Combined RUN commands to reduce layer count
-   Removed `__pycache__` directories (bytecode cache)
-   Removed `.pyc` files
-   Purged pip cache after installing UV

Build and measure:

```
docker build -t task-api:optimized -f Dockerfile.v4-optimized .
```

**Output:**

```
[+] Building 14.8s (14/14) FINISHED => [builder 4/4] RUN uv pip install --system --no-cache ...          2.6s => exporting to image                                                0.2s
```

```
docker images task-api:optimized
```

**Output:**

```
REPOSITORY   TAG        IMAGE ID       CREATED          SIZEtask-api     optimized  f7g8h9i0j1k2   3 seconds ago    115MB
```

* * *

## Final Size Comparison

Let's see all versions side by side:

```
docker images task-api --format "table {{.Tag}}\t{{.Size}}"
```

**Output:**

```
TAG          SIZEoptimized    115MBalpine       118MBmultistage   182MBslim         458MBnaive        1.21GB
```

Version

Size

Technique

Reduction

Naive

1.21GB

Full Python image + pip

Baseline

Slim

458MB

python:3.12-slim

62%

Multi-stage

182MB

Separate build/runtime + UV

85%

Alpine

118MB

Alpine base + UV

90%

Optimized

115MB

Layer cleanup + cache purge

**90.5%**

**Result: 1.21GB reduced to 115MB (90.5% reduction)**

* * *

## Analyzing Layers with docker history

The `docker history` command shows what each layer contains:

```
docker history task-api:optimized
```

**Output:**

```
IMAGE          CREATED         CREATED BY                                      SIZEf7g8h9i0j1k2   2 minutes ago   CMD ["uvicorn" "main:app" "--host" "0.0.0...   0B<missing>      2 minutes ago   EXPOSE 8000                                     0B<missing>      2 minutes ago   COPY main.py . # buildkit                       1.52kB<missing>      2 minutes ago   ENV PYTHONUNBUFFERED=1                          0B<missing>      2 minutes ago   COPY /usr/local/bin /usr/local/bin # bui...     1.2MB<missing>      2 minutes ago   COPY /usr/local/lib/python3.12/site-pack...     58.4MB<missing>      2 minutes ago   WORKDIR /app                                    0B<missing>      3 weeks ago     CMD ["python3"]                                 0B<missing>      3 weeks ago     RUN /bin/sh -c set -eux;   apk add --no-...    1.85MB<missing>      3 weeks ago     ENV PYTHON_VERSION=3.12.8                       0B...
```

The SIZE column shows the contribution of each layer:

-   Application code: ~1.5KB
-   Installed binaries (uvicorn, etc.): ~1.2MB
-   Installed packages (site-packages): ~58MB
-   Python Alpine base: ~55MB (shown in earlier layers)

If you see an unexpectedly large layer, that's where to focus optimization efforts.

* * *

## Base Image Tradeoffs

Base Image

Size

Pros

Cons

Use When

`python:3.12-slim`

~150MB

Most compatible, safer

Larger than Alpine

Default choice; C extensions work out of box

`python:3.12-alpine`

~50MB

Smallest, fast builds

Some packages need compilation

Size-critical deployments, pure Python

`distroless/python3`

~50MB

Maximum security, no shell

Can't debug interactively

Production security-critical services

**For this chapter**: Alpine is excellent for AI services that don't require complex C dependencies. Your Task API (and most FastAPI services) work perfectly with Alpine.

**When Alpine fails**: If you need numpy, pandas, or other packages with C extensions that aren't available as Alpine wheels, fall back to slim.

* * *

## Handling Large Model Files

A critical consideration for AI services: **never embed large model files in Docker images.**

**Wrong approach** (image becomes 4GB+):

```
# DON'T DO THISCOPY models/model.bin /app/models/
```

**Correct approach** (use volume mounts):

```
# Image stays small, models loaded at runtime# No COPY for model files
```

Run with volume mount:

```
docker run -v $(pwd)/models:/app/models task-api:optimized
```

**Output:**

```
INFO:     Started server process [1]INFO:     Waiting for application startup.INFO:     Application startup complete.INFO:     Uvicorn running on http://0.0.0.0:8000
```

Your application code loads models from the mounted directory:

```
from pathlib import Pathmodels_dir = Path("/app/models")model_path = models_dir / "model.bin"@app.on_event("startup")async def load_model():    if model_path.exists():        print(f"Loading model from {model_path}")        # Load your model here
```

Benefits:

-   Image stays small (~115MB)
-   Models can be updated without rebuilding
-   Same model can be shared across container instances
-   Model storage handled by Kubernetes PersistentVolumes in production

* * *

## The Production Pattern

Here's the pattern to apply to any Python AI service:

```
# Stage 1: BuildFROM python:3.12-alpine AS builderWORKDIR /app# Install UV for fast dependency installationRUN pip install uvCOPY requirements.txt .RUN uv pip install --system --no-cache -r requirements.txt# Stage 2: RuntimeFROM python:3.12-alpineWORKDIR /app# Copy installed packages from builderCOPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packagesCOPY --from=builder /usr/local/bin /usr/local/binENV PYTHONUNBUFFERED=1# Copy application code (NOT model files)COPY . .EXPOSE 8000CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**When to deviate**:

Situation

Adjustment

C extensions fail on Alpine

Use `python:3.12-slim` instead

Need system libraries

Add `RUN apk add --no-cache [packages]` in builder

Security-critical production

Consider `distroless/python3`

Debugging required

Keep Alpine (has shell) or slim

* * *

## Try With AI

Now apply what you've learned to your own service.

**Prompt 1: Analyze Your Current Dockerfile**

```
I have a Dockerfile for a FastAPI service. Analyze it for size optimization opportunities:[paste your Dockerfile here]Questions:1. What's the estimated image size with current base image?2. Would multi-stage builds help? Why or why not?3. What specific changes would achieve 70%+ size reduction?
```

**What you're learning**: How to evaluate an existing Dockerfile against optimization criteria. AI can identify which techniques apply to your specific dependencies.

* * *

**Prompt 2: Generate Optimized Dockerfile**

```
Create a multi-stage Dockerfile for my Python service with these requirements:Dependencies: [list your requirements.txt]Entry point: uvicorn main:app --host 0.0.0.0 --port 8000Target: Under 150MB final imageConstraints:- Use UV package manager (not pip)- Use Alpine base image- No model files in image (volume mount)Include comments explaining each optimization.
```

**What you're learning**: How to specify constraints clearly so AI generates a Dockerfile matching your exact requirements. The constraints prevent AI from defaulting to less optimized patterns.

* * *

**Prompt 3: Debug Size Issues**

```
My Docker image is larger than expected. Here's my Dockerfile and the output of docker history:[paste Dockerfile]docker history output:[paste docker history output]Questions:1. Which layer is contributing the most unexpected size?2. What's likely included that shouldn't be?3. How would you modify the Dockerfile to fix this?
```

**What you're learning**: How to use `docker history` output to diagnose size problems. AI can interpret layer contributions and suggest targeted fixes.

* * *

Verify your learning by building an optimized image for your Part 6 FastAPI agent and measuring the size reduction. Target: 70%+ reduction from a naive Dockerfile.

* * *

## Reflect on Your Skill

You built a `docker-deployment` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my docker-deployment skill, generate a multi-stage Dockerfile for image size optimization.Does my skill generate separate build and runtime stages with proper COPY --from directives?
```

### Identify Gaps

Ask yourself:

-   Did my skill include multi-stage build patterns?
-   Did it handle UV package manager and Alpine base images?

### Improve Your Skill

If you found gaps:

```
My docker-deployment skill is missing image optimization techniques.Update it to include multi-stage builds, UV package manager usage, Alpine base images, and layer cache optimization strategies.
```

* * *

Checking access...

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 49: Docker for AI Services](/docs/AI-Cloud-Native-Development/docker-for-ai-services)
-   Production Hardening

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/49-docker-for-ai-services/06-production-hardening.md)

# Production Hardening

Your container builds and runs. The image is optimized with multi-stage builds. But production environments demand more than a working container—they require security, observability, and resilience.

Consider what happens when your containerized FastAPI agent service goes to production. Kubernetes needs to know if your service is healthy before routing traffic to it. If your container runs as root, a security vulnerability could give an attacker full control of the host. If configuration is hardcoded, you'll need to rebuild images for every environment (dev, staging, production).

Production hardening addresses these concerns through three patterns: environment variable configuration (flexibility), health checks (observability), and non-root users (security). These aren't optional extras—they're requirements for any serious deployment. In this lesson, you'll add each pattern to your Dockerfile, understand why it matters, and end up with a production-ready container template you'll use for every AI service you build.

* * *

## The Three Pillars of Production Hardening

Before diving into implementation, understand what we're solving:

Pillar

Problem

Solution

**Configuration**

Hardcoded values require image rebuilds

Environment variables at runtime

**Observability**

Orchestrators can't detect unhealthy containers

Health check endpoints + HEALTHCHECK instruction

**Security**

Root containers enable privilege escalation

Non-root user execution

Each pillar is independent but together they form the foundation of production-ready containers. Let's implement each one.

* * *

## Environment Variables for Configuration

Hardcoded configuration creates fragile containers. If your Dockerfile specifies `LOG_LEVEL=INFO`, you need a new image for debug logging. If `API_HOST=production.example.com`, you can't run locally.

Docker provides two instructions for configuration:

-   **ARG**: Build-time variables (available during `docker build`, NOT in running container)
-   **ENV**: Runtime variables (available when container runs)

### Understanding ENV

The `ENV` instruction sets environment variables that persist into the running container:

```
ENV PYTHONUNBUFFERED=1ENV LOG_LEVEL=INFOENV API_HOST=0.0.0.0ENV API_PORT=8000
```

Your application reads these values at runtime.

Update `main.py`:

```
import osfrom fastapi import FastAPIapp = FastAPI()LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")API_HOST = os.getenv("API_HOST", "0.0.0.0")@app.get("/")def read_root():    return {"message": "Hello from Docker!", "log_level": LOG_LEVEL}@app.get("/health")def health_check():    return {"status": "healthy"}
```

**Output:**

```
$ docker run -p 8000:8000 my-app:latestINFO:     Uvicorn running on http://0.0.0.0:8000$ curl http://localhost:8000/{"message":"Hello from Docker!","log_level":"INFO"}
```

### Overriding ENV at Runtime

The `-e` flag overrides environment variables when starting a container:

```
docker run -e LOG_LEVEL=DEBUG -e API_PORT=9000 -p 9000:9000 my-app:latest
```

**Output:**

```
$ docker run -e LOG_LEVEL=DEBUG -p 8000:8000 my-app:latestINFO:     Uvicorn running on http://0.0.0.0:8000$ curl http://localhost:8000/{"message":"Hello from Docker!","log_level":"DEBUG"}
```

The container uses `DEBUG` instead of the default `INFO` without rebuilding the image.

### Understanding ARG

`ARG` defines build-time variables. They're available during `docker build` but not when the container runs:

```
ARG PYTHON_VERSION=3.12FROM python:${PYTHON_VERSION}-alpine# ARG value is accessible here during buildRUN echo "Building with Python ${PYTHON_VERSION}"# But NOT accessible at runtime# The following would fail because ARG is gone after build:# CMD ["echo", "${PYTHON_VERSION}"]
```

Build with different Python versions:

```
docker build --build-arg PYTHON_VERSION=3.11 -t my-app:py311 .docker build --build-arg PYTHON_VERSION=3.12 -t my-app:py312 .
```

**Output:**

```
$ docker build --build-arg PYTHON_VERSION=3.11 -t my-app:py311 .[+] Building 2.1s (8/8) FINISHED => [1/4] FROM docker.io/library/python:3.11-alpine => [2/4] RUN echo "Building with Python 3.11"Building with Python 3.11...
```

### When to Use ARG vs ENV

Use Case

Instruction

Example

Python version for base image

ARG

`ARG PYTHON_VERSION=3.12`

Log level for running app

ENV

`ENV LOG_LEVEL=INFO`

Git commit hash for image tag

ARG

`ARG GIT_SHA`

API keys (runtime secrets)

ENV (via `-e`)

`-e API_KEY=abc123`

Package versions during build

ARG

`ARG UV_VERSION=0.4.0`

Feature flags in running container

ENV

`ENV ENABLE_CACHING=true`

**Key distinction**: If you need the value when the container RUNS, use `ENV`. If you only need it during BUILD, use `ARG`.

* * *

## Health Check Implementation

Orchestrators like Kubernetes need to know if your container is healthy. A container can be "running" but completely broken—the process exists but crashes on every request. Health checks detect this.

### Adding a Health Endpoint to FastAPI

First, ensure your FastAPI service has a health endpoint.

Update `main.py`:

```
from fastapi import FastAPIimport osapp = FastAPI()@app.get("/")def read_root():    return {"message": "Hello from Docker!"}@app.get("/health")def health_check():    """Health check endpoint for Docker HEALTHCHECK and Kubernetes probes."""    return {"status": "healthy"}
```

Test the endpoint:

```
uvicorn main:app --host 0.0.0.0 --port 8000 &curl http://localhost:8000/health
```

**Output:**

```
$ curl http://localhost:8000/health{"status":"healthy"}
```

### Docker HEALTHCHECK Instruction

The `HEALTHCHECK` instruction tells Docker how to verify container health:

```
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \    CMD wget --no-verbose --tries=1 --spider http://localhost:8000/health || exit 1
```

Let's break down each component:

Parameter

Value

Meaning

`--interval=30s`

30 seconds

How often to run the check

`--timeout=10s`

10 seconds

How long to wait for response

`--start-period=5s`

5 seconds

Grace period for container startup

`--retries=3`

3 attempts

Failed checks before marking unhealthy

`CMD`

wget command

The actual health check command

**Why wget instead of curl?**

Alpine images include `wget` by default but not `curl`. Using `wget` avoids adding dependencies. For slim-based images, use `curl`:

```
# For Alpine-based images (wget built-in):HEALTHCHECK CMD wget --no-verbose --tries=1 --spider http://localhost:8000/health || exit 1# For slim-based images (curl built-in):HEALTHCHECK CMD curl --fail http://localhost:8000/health || exit 1
```

### Verifying Health Check Status

Build and run a container with the health check:

```
docker build -t health-app:latest .docker run -d --name health-test -p 8000:8000 health-app:latest
```

Wait 30 seconds for the first health check, then inspect:

```
docker inspect --format='{{json .State.Health}}' health-test | python -m json.tool
```

**Output:**

```
{    "Status": "healthy",    "FailingStreak": 0,    "Log": [        {            "Start": "2024-12-27T10:30:00.123456Z",            "End": "2024-12-27T10:30:00.234567Z",            "ExitCode": 0,            "Output": ""        }    ]}
```

The `"Status": "healthy"` confirms the health check passed. If the endpoint fails, status becomes `"unhealthy"` and `FailingStreak` increments.

### Health Check Status in docker ps

```
docker ps
```

**Output:**

```
CONTAINER ID   IMAGE             COMMAND                  STATUS                    PORTSa1b2c3d4e5f6   health-app:latest "uvicorn main:app..."   Up 2 minutes (healthy)   0.0.0.0:8000->8000/tcp
```

Notice `(healthy)` in the STATUS column. This is how you quickly verify container health.

Clean up:

```
docker stop health-test && docker rm health-test
```

* * *

## Non-Root User Security

By default, Docker containers run as root. If an attacker exploits a vulnerability in your application, they have root access to the container—and potentially the host.

Running as a non-root user limits damage. Even if compromised, the attacker has limited privileges.

### Creating a Non-Root User

Add a dedicated user in your Dockerfile:

```
# Create non-root user with specific UIDRUN adduser -D -u 1000 appuser
```

The flags:

-   `-D`: Don't assign a password (non-interactive)
-   `-u 1000`: Assign user ID 1000 (conventional for app users)
-   `appuser`: Username

### Switching to Non-Root User

After creating the user, switch to it with `USER`:

```
# Create userRUN adduser -D -u 1000 appuser# ... copy files with ownership ...# Switch to non-root user BEFORE CMDUSER appuserCMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Copying Files with Correct Ownership

Files copied into the container are owned by root by default. Use `--chown` to set ownership:

```
# Copy with ownership set to appuserCOPY --chown=appuser:appuser main.py .
```

Without `--chown`, the non-root user can't read the files:

```
# Without --chown:$ docker exec my-container ls -la /app/main.py-rw-r--r-- 1 root root 237 Dec 27 10:00 main.py  # Owned by root# With --chown:$ docker exec my-container ls -la /app/main.py-rw-r--r-- 1 appuser appuser 237 Dec 27 10:00 main.py  # Owned by appuser
```

### Verifying Non-Root Execution

Build and run, then check who's running the process:

```
docker build -t secure-app:latest .docker run -d --name secure-test secure-app:latestdocker exec secure-test whoami
```

**Output:**

```
$ docker exec secure-test whoamiappuser
```

Not root. The container runs with limited privileges.

Clean up:

```
docker stop secure-test && docker rm secure-test
```

* * *

## The Production Dockerfile Template

Combining all three pillars—configuration, health checks, and non-root user—creates a production-ready template:

```
# Stage 1: BuildFROM python:3.12-alpine AS builderWORKDIR /app# Install UV for fast dependency installationRUN pip install uvCOPY requirements.txt .# Install dependencies with UVRUN uv pip install --system --no-cache -r requirements.txt# Stage 2: RuntimeFROM python:3.12-alpine# Create non-root userRUN adduser -D -u 1000 appuserWORKDIR /app# Copy dependencies from builderCOPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packagesCOPY --from=builder /usr/local/bin /usr/local/bin# Copy application code with ownershipCOPY --chown=appuser:appuser main.py .# Environment configurationENV PYTHONUNBUFFERED=1ENV LOG_LEVEL=INFO# Switch to non-root userUSER appuser# Health checkHEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \    CMD wget --no-verbose --tries=1 --spider http://localhost:8000/health || exit 1EXPOSE 8000CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

This template includes:

-   Multi-stage build (from Lesson 5)
-   UV for fast dependency installation
-   Non-root user (`appuser`)
-   Correct file ownership (`--chown`)
-   Environment variable defaults
-   Health check with appropriate timing
-   Exposed port documentation

### Building and Testing the Complete Template

Create the required files.

Create `requirements.txt`:

```
fastapi==0.115.0uvicorn==0.30.0
```

Create `main.py`:

```
import osfrom fastapi import FastAPIapp = FastAPI()LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")@app.get("/")def read_root():    return {"message": "Production hardened!", "log_level": LOG_LEVEL}@app.get("/health")def health_check():    return {"status": "healthy"}
```

Build and run:

```
docker build -t production-app:latest .docker run -d --name prod-test -p 8000:8000 production-app:latest
```

**Output:**

```
$ docker build -t production-app:latest .[+] Building 12.3s (14/14) FINISHED => [builder 1/4] FROM python:3.12-alpine => [builder 2/4] WORKDIR /app => [builder 3/4] RUN pip install uv => [builder 4/4] RUN uv pip install --system --no-cache -r requirements.txt => [stage-1 1/6] FROM python:3.12-alpine => [stage-1 2/6] RUN adduser -D -u 1000 appuser => [stage-1 3/6] WORKDIR /app => [stage-1 4/6] COPY --from=builder /usr/local/lib/python3.12/site-packages... => [stage-1 5/6] COPY --from=builder /usr/local/bin /usr/local/bin => [stage-1 6/6] COPY --chown=appuser:appuser main.py . => exporting to imageSuccessfully tagged production-app:latest
```

Verify all three pillars:

```
# 1. Configuration: Override LOG_LEVELdocker run --rm -e LOG_LEVEL=DEBUG production-app:latest sh -c 'echo $LOG_LEVEL'
```

**Output:**

```
DEBUG
```

```
# 2. Health check: Wait 30s, then check statussleep 35docker inspect --format='{{.State.Health.Status}}' prod-test
```

**Output:**

```
healthy
```

```
# 3. Non-root user: Verify process ownerdocker exec prod-test whoami
```

**Output:**

```
appuser
```

All three pillars verified. Clean up:

```
docker stop prod-test && docker rm prod-test
```

* * *

## Common Hardening Mistakes

### Mistake 1: USER Before COPY

Placing `USER appuser` before `COPY` commands can cause permission errors:

```
# WRONG: User can't copy because it doesn't own /app yetUSER appuserCOPY main.py .  # Fails: permission denied# CORRECT: Copy first with ownership, then switch userCOPY --chown=appuser:appuser main.py .USER appuser
```

### Mistake 2: Missing Health Endpoint

Adding `HEALTHCHECK` without implementing the endpoint:

```
# Docker checks /health, but your app doesn't have that routeHEALTHCHECK CMD wget --spider http://localhost:8000/health || exit 1
```

**Result**: Container marked unhealthy immediately.

**Fix**: Always implement the health endpoint in your application code.

### Mistake 3: Wrong Port in HEALTHCHECK

The health check runs INSIDE the container. Use the container's internal port:

```
# WRONG: 9000 is the host port, not container portHEALTHCHECK CMD wget --spider http://localhost:9000/health || exit 1# CORRECT: 8000 is the port your app listens on inside the containerHEALTHCHECK CMD wget --spider http://localhost:8000/health || exit 1
```

### Mistake 4: Secrets in ENV

Never put sensitive data in Dockerfile ENV instructions:

```
# WRONG: Secret visible in image history and inspectENV API_KEY=sk-abc123secret# CORRECT: Pass at runtime, never store in image# docker run -e API_KEY=sk-abc123secret my-app:latest
```

Use `-e` flag at runtime or Docker secrets for sensitive configuration.

* * *

## Production Hardening Checklist

Before deploying any container to production, verify:

Check

Command

Expected

Non-root user

`docker exec <container> whoami`

Not `root`

Health check exists

`docker inspect --format='{{.Config.Healthcheck}}' <image>`

Non-empty

Health status

`docker inspect --format='{{.State.Health.Status}}' <container>`

`healthy`

No hardcoded secrets

`docker history <image>`

No API keys visible

Config via ENV

`docker run --rm -e LOG_LEVEL=DEBUG <image> env`

Variable overridable

* * *

## Try With AI

**Setup**: You have the Task API from previous lessons. Now you'll apply production hardening patterns.

**Part 1: Analyze Your Dockerfile for Security Gaps**

Start with your existing Dockerfile from Lesson 5. Ask AI:

```
Review this Dockerfile for production readiness. Check for:1. Running as root (security risk)2. Missing health check (observability gap)3. Hardcoded configuration (flexibility issue)[paste your Dockerfile]What hardening patterns are missing?
```

**What you're learning**: Identifying security and operational gaps before they cause production incidents. A systematic review catches issues that "it works" testing misses.

**Part 2: Design Health Check Strategy**

Your Task API has a `/tasks` endpoint. Ask AI:

```
My FastAPI service has these endpoints:- GET /tasks (list tasks)- POST /tasks (create task)- GET /tasks/{id} (get specific task)Design a health check strategy:1. Should I create a dedicated /health endpoint or use an existing one?2. What should the health check verify (database connection, API availability)?3. What HEALTHCHECK parameters make sense for a task API?
```

**What you're learning**: Health check design requires thinking about what "healthy" means for your specific service. A simple HTTP 200 might miss database connectivity issues.

**Part 3: Apply Hardening to Your Own Project**

Take your Dockerfile and apply all three pillars. Ask AI:

```
Transform this Dockerfile to production-ready:1. Add non-root user (appuser, UID 1000)2. Add HEALTHCHECK using wget for Alpine3. Add ENV defaults for LOG_LEVEL and PYTHONUNBUFFERED4. Ensure correct file ownership with --chown[paste your Dockerfile]Show me the hardened version with comments explaining each security measure.
```

**What you're learning**: Applying patterns systematically transforms a development Dockerfile into production infrastructure. The comments help you understand each change so you can apply the same patterns to future projects.

**Safety Note**: Never include real API keys or secrets in Dockerfiles you share with AI. Use placeholder values like `API_KEY=your-key-here` and replace them with actual secrets at runtime using `-e` flags or Docker secrets.

* * *

## Reflect on Your Skill

You built a `docker-deployment` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my docker-deployment skill, generate a production-hardened Dockerfile.Does my skill include non-root users, health checks, and proper environment variable configuration?
```

### Identify Gaps

Ask yourself:

-   Did my skill include security best practices like non-root users?
-   Did it handle HEALTHCHECK instructions and environment variable management?

### Improve Your Skill

If you found gaps:

```
My docker-deployment skill is missing production hardening patterns.Update it to include non-root user creation, HEALTHCHECK instructions, ENV/ARG configuration, and proper file ownership with --chown.
```

* * *

Checking access...

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 49: Docker for AI Services](/docs/AI-Cloud-Native-Development/docker-for-ai-services)
-   Docker Image Builder Skill

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/49-docker-for-ai-services/07-docker-image-builder-skill.md)

# Docker Image Builder Skill

You've now written Dockerfiles for the Task API through six lessons. Each time, you made similar decisions: base image selection, dependency strategy, layer optimization, security posture. What if you could encode this reasoning so AI can apply it consistently to ANY project?

That's what skills do. A skill captures domain expertise in a format that AI can apply reliably across contexts. Instead of re-explaining your Docker preferences every time, you encode them once. The AI then reasons through your principles for each new project, producing Dockerfiles that match your production standards.

This lesson teaches you to transform your Docker knowledge into a reusable skill. You'll learn the Persona + Questions + Principles pattern that makes skills effective, create a complete SKILL.md file, and test it against projects you haven't seen before.

* * *

## What Makes a Pattern Worth Encoding

Not every workflow deserves a skill. Creating skills takes effort. You need to identify patterns that justify that investment.

**Three criteria determine if a pattern is worth encoding:**

Criterion

Question to Ask

Docker Example

**Recurrence**

Will this pattern appear in 3+ projects?

Containerizing Python services happens constantly

**Complexity**

Does it involve 5+ decision points?

Base image, multi-stage, UV, security, volumes, networking

**Organizational Value**

Does it accelerate future work?

Every new service needs containerization

Docker containerization meets all three. You containerize services repeatedly, each Dockerfile involves 8-10 decisions, and faster containerization accelerates deployment across all projects.

**Patterns that DON'T justify skills:**

-   One-off configuration (single project setup)
-   Simple commands (docker build, docker run)
-   Trivial decisions (choosing between two obvious options)

**Exercise**: Before continuing, list three patterns from your own work that might justify skills. Apply the three criteria to each.

* * *

## The Persona + Questions + Principles Pattern

Effective skills follow a consistent structure. Each component serves a specific purpose:

### Persona: The Cognitive Stance

A persona establishes HOW the AI should think. It's not "you are an expert"—that's too vague. A good persona specifies the perspective and priorities that produce right thinking.

**Weak persona:**

```
You are a Docker expert.
```

**Strong persona:**

```
Think like a DevOps engineer who optimizes container images for productionKubernetes deployments. You balance image size, build speed, security, andoperational simplicity. When tradeoffs exist, you favor smaller images andfaster pulls over build-time convenience.
```

The strong persona tells the AI:

-   **Domain**: DevOps engineering
-   **Target**: Production Kubernetes
-   **Priorities**: Size, speed, security, simplicity
-   **Tradeoff resolution**: Favor runtime over build-time

### Analysis Questions: Context-Specific Reasoning

Analysis questions force the AI to gather context before acting. Without them, AI produces generic solutions. With them, AI reasons about YOUR specific situation.

**Generic approach (no questions):**

```
Generate a Dockerfile for this Python project.
```

**Context-aware approach (with questions):**

```
Before generating, analyze:1. Deployment Target: Kubernetes cluster, Docker Compose, bare Docker?2. Base Image Strategy: What constraints apply (security, size, compatibility)?3. Large Files: Are there model files or data that should be volume-mounted?4. Security Requirements: Non-root user required? Read-only filesystem?5. Health Monitoring: What endpoints indicate service health?6. Build Frequency: How often will this image be rebuilt?
```

Each question targets a decision point. The answers shape the Dockerfile.

### Principles: Non-Negotiable Decisions

Principles are rules that apply regardless of context. They encode your hard-won lessons about what works in production.

**Docker containerization principles:**

1.  **Multi-Stage Always**: Separate build dependencies from runtime
2.  **UV for Speed**: Use UV package manager (10-100x faster than pip)
3.  **Alpine Default**: Start with alpine, fall back to slim if compatibility issues
4.  **Health Checks Mandatory**: Every production container needs HEALTHCHECK
5.  **Non-Root Default**: Run as non-root user unless explicitly required otherwise
6.  **Environment Configuration**: All configuration via environment variables
7.  **No Secrets in Image**: Never COPY .env or credentials into image

These aren't suggestions. They're non-negotiables that every Dockerfile should follow unless there's explicit justification to deviate.

* * *

## Designing the Production Dockerfile Skill

Let's build the complete skill, component by component.

### Skill Persona

```
Think like a DevOps engineer who optimizes container images for productionKubernetes deployments. You balance four priorities:1. **Image Size**: Smaller images mean faster pulls and lower registry costs2. **Build Speed**: Developer iteration time matters; use UV and layer caching3. **Security**: Non-root users, minimal attack surface, no embedded secrets4. **Operational Simplicity**: Health checks, clear labels, predictable behaviorWhen these priorities conflict, resolve as follows:- Security trumps convenience (always non-root, always health checks)- Runtime size trumps build speed (multi-stage even if slower to build)- Operational clarity trumps clever optimization (explicit over implicit)
```

### Analysis Questions

```
Before generating a Dockerfile, analyze the project by answering:1. **Deployment Target**   - Kubernetes cluster (needs probes, resource limits)?   - Docker Compose (local development, simpler requirements)?   - Bare Docker (single container, minimal orchestration)?2. **Base Image Strategy**   - Are there security constraints (approved base images only)?   - Does the application require specific system libraries?   - Is alpine compatible, or must we use slim/full?3. **Dependency Installation**   - Python project (use UV for 10-100x faster installs)?   - Node project (use npm ci for reproducible builds)?   - Mixed stack (consider separate build stages)?4. **Large Files (>100MB)**   - Model files that should be volume-mounted?   - Static assets that should be in CDN instead?   - Data files that change independently of code?5. **Security Requirements**   - Non-root user required (almost always yes)?   - Read-only filesystem feasible?   - What secrets need injection at runtime?6. **Health Monitoring**   - What endpoint indicates healthy service?   - What dependencies must be ready (database, cache)?   - What startup time should health check account for?7. **Build Context**   - What files should .dockerignore exclude?   - Are there large directories (node_modules, .git) to skip?   - Does build need access to private registries?
```

### Principles

```
Apply these principles to every Dockerfile:## Build Structure**P1: Multi-Stage Always**Separate build stage (has compilers, dev tools) from runtime stage (minimal).Even if current deps don't require compilation, future deps might.**P2: Layer Order Matters**Copy dependency files first (requirements.txt, package.json), install,then copy source. This maximizes layer cache hits.**P3: Single RUN for Related Operations**Combine related commands with && to reduce layers and ensure cleanuphappens in same layer:```dockerfileRUN pip install uv && \    uv pip install --system -r requirements.txt && \    rm -rf /root/.cache
```

## Package Management

**P4: UV for Python** Always use UV package manager for Python. It's 10-100x faster than pip:

```
RUN pip install uv && \    uv pip install --system --no-cache -r requirements.txt
```

**P5: Lock Files Required** Use requirements.txt with pinned versions or uv.lock for reproducibility. Never install without version constraints in production.

## Base Images

**P6: Alpine Default** Start with python:3.12-alpine (50MB). Fall back to slim (150MB) only if alpine causes compatibility issues with specific packages.

**P7: Pin Versions** Use python:3.12-alpine, not python:alpine. Explicit versions prevent surprise breakage when base images update.

## Security

**P8: Non-Root User** Create and switch to non-root user:

```
RUN adduser --disabled-password --gecos '' appuserUSER appuser
```

**P9: No Secrets in Image** Never COPY .env, credentials, or API keys. Inject via environment at runtime. Use Docker secrets or Kubernetes secrets for sensitive data.

**P10: Minimal Installed Packages** Only install what runtime needs. Build tools stay in build stage.

## Runtime Configuration

**P11: Health Checks Mandatory** Every production container needs HEALTHCHECK:

```
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \  CMD curl -f http://localhost:8000/health || exit 1
```

**P12: Environment Variables for Configuration** All configuration via ENV. No hardcoded values in Dockerfile.

```
ENV APP_PORT=8000 \    LOG_LEVEL=info \    PYTHONUNBUFFERED=1
```

## Large Files

**P13: Volume Mount, Don't COPY** Files >100MB (models, datasets) should be volume-mounted at runtime:

```
# docker-compose.yamlvolumes:  - ./models:/app/models
```

Never embed large files in the image.

```
---## The SKILL.md File FormatSkills live in SKILL.md files within the `.claude/skills/` directory. Here's the complete format:```markdown---name: production-dockerfiledescription: Generate production-ready Dockerfiles with multi-stage builds, security best practices, and optimization. Use when containerizing Python applications for Kubernetes or Docker deployments.allowed-tools: Read, Write, Edit, Bash---# Production Dockerfile Skill## PersonaThink like a DevOps engineer who optimizes container images for productionKubernetes deployments. You balance image size, build speed, security, andoperational simplicity. When tradeoffs exist:- Security trumps convenience- Runtime size trumps build speed- Operational clarity trumps clever optimization## Analysis QuestionsBefore generating a Dockerfile, analyze the project:1. **Deployment Target**: Kubernetes, Docker Compose, or bare Docker?2. **Base Image Strategy**: Security constraints? Required system libraries?3. **Dependency Installation**: Python (UV)? Node (npm ci)? Mixed?4. **Large Files**: Model files >100MB to volume-mount?5. **Security Requirements**: Non-root user? Read-only filesystem?6. **Health Monitoring**: Health endpoint? Startup time?7. **Build Context**: What should .dockerignore exclude?## Principles### Build Structure- **Multi-Stage Always**: Separate build and runtime stages- **Layer Order**: Dependency files first, then source- **Combine RUN**: Related operations in single RUN### Package Management- **UV for Python**: 10-100x faster than pip- **Lock Files**: Pinned versions for reproducibility### Base Images- **Alpine Default**: Start with alpine, fall back to slim- **Pin Versions**: Explicit tags, not :latest### Security- **Non-Root User**: Always create and switch to appuser- **No Secrets**: Environment injection at runtime only- **Minimal Packages**: Only runtime dependencies### Runtime- **Health Checks**: Every container needs HEALTHCHECK- **Environment Config**: All settings via ENV### Large Files- **Volume Mount**: Files >100MB via volumes, not COPY## Output FormatWhen generating Dockerfiles, produce:1. **Dockerfile** with comments explaining each decision2. **.dockerignore** excluding build artifacts and secrets3. **docker-compose.yaml** (if multi-service or volume mounts needed)4. **Size estimate** comparing to naive approach## ActivationUse this skill when:- Containerizing a new Python service- Optimizing an existing Dockerfile- Reviewing containerization for security issues- Setting up Docker-based CI/CD pipelines
```

* * *

## Testing the Skill

A skill that only works on familiar projects isn't useful. Test against novel scenarios to validate it generalizes.

### Test 1: Python CLI Tool (No Web Framework)

**Project**: A command-line tool that processes CSV files

**Apply the skill**:

-   Deployment target: Bare Docker (no orchestration)
-   No health endpoint (CLI tool, not service)
-   No large files to mount

**Expected adaptations**:

-   CMD should run the CLI, not a web server
-   No HEALTHCHECK (not applicable to CLI)
-   Still uses multi-stage, UV, alpine, non-root

### Test 2: FastAPI Service (Like Task API)

**Project**: The FastAPI agent service from Part 6

**Apply the skill**:

-   Deployment target: Kubernetes
-   Health endpoint at /health
-   May have model files

**Expected output**: Full production Dockerfile matching patterns from Lesson 5.

### Test 3: ML Inference Service (Large Model Files)

**Project**: Service with 4GB model file

**Apply the skill**:

-   Model file triggers "large files" analysis
-   Must NOT embed model in image
-   Volume mount pattern required

**Expected adaptations**:

-   Dockerfile has no COPY for model directory
-   docker-compose.yaml shows volume mount
-   Application expects model at /app/models

### Validation Criteria

A skill passes testing when:

Criterion

How to Verify

**Correct structure**

Multi-stage build present in all outputs

**Context-specific**

CLI vs service differences handled correctly

**Principles applied**

All 13 principles visible in output

**Novel scenarios**

Works on projects not explicitly trained for

* * *

## Intelligence Accumulation

Creating this skill demonstrates **intelligence accumulation**—transforming tacit knowledge into explicit, reusable capability that compounds across projects.

**Before the skill:**

-   You know Docker best practices
-   You apply them manually each time
-   Consistency depends on memory
-   New team members must learn from scratch

**After the skill:**

-   Knowledge is encoded explicitly
-   AI applies it consistently
-   Standards are documented
-   Onboarding is automatic

This is how organizations build compounding capability. Each skill adds to the library. Each project benefits from accumulated intelligence. The gap between skilled and unskilled teams widens with every encoding.

**Your Docker skill is now organizational knowledge, not personal expertise.**

* * *

## Common Skill Design Mistakes

**Mistake 1: Too Specific**

```
# Wrong: Only works for FastAPIname: fastapi-dockerfile
```

```
# Right: Works for any Python servicename: production-dockerfile
```

**Mistake 2: Vague Persona**

```
# Wrong: No guidance on prioritiesThink like a Docker expert.
```

```
# Right: Clear priorities and tradeoffsThink like a DevOps engineer who prioritizes size over build speed...
```

**Mistake 3: Missing Analysis Questions** Without questions, the skill produces generic output. Every skill needs questions that gather project-specific context.

**Mistake 4: Principles Without Rationale**

```
# Wrong: Rule without reasonAlways use alpine.
```

```
# Right: Principle with justificationAlpine Default: Start with alpine (50MB) for minimal size.Fall back to slim only if compatibility issues arise.
```

**Mistake 5: No Test Cases** A skill without test cases has unknown coverage. Include at least 3 diverse test scenarios.

* * *

## Try With AI

**Setup**: You've learned the Persona + Questions + Principles pattern. Now apply it.

**Part 1: Use the Production Dockerfile Skill**

```
I have a FastAPI service with these dependencies:- fastapi==0.115.0- uvicorn==0.30.0- pydantic==2.6.0- httpx==0.27.0The service:- Deploys to Kubernetes- Has a /health endpoint- No large model files- Needs non-root userUse the production-dockerfile skill approach to containerize this service.Show me how you'd apply the analysis questions and principles.
```

**What you're learning**: How a skill structures AI's reasoning process, ensuring consistent application of Docker best practices.

**Part 2: Evaluate Against Principles**

Take a Dockerfile you've written previously (or one AI generates) and evaluate it:

```
Here's my current Dockerfile:[paste your Dockerfile]Evaluate this against the production-dockerfile skill principles:1. Which principles are followed?2. Which principles are violated?3. What specific changes would bring it into compliance?For each violation, explain the security or operational risk.
```

**What you're learning**: Using principles as evaluation criteria, not just generation guidance.

**Part 3: Create Your Own Skill**

Identify a recurring pattern in YOUR work (not Docker—something else you do repeatedly):

```
I want to create a skill for: [your pattern]Help me develop:1. A persona that captures the right cognitive stance2. 5-7 analysis questions for context gathering3. 7-10 non-negotiable principlesStart with the persona. What perspective and priorities shouldthis skill encode?
```

**What you're learning**: The skill creation process generalizes beyond Docker to any domain where you have accumulated expertise worth encoding.

* * *

**Safety Note**: When testing skills, use non-production environments. A skill that generates Dockerfiles might produce configurations that work but violate your organization's specific security policies. Always review generated configurations before deploying to production.

Checking access...

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 49: Docker for AI Services](/docs/AI-Cloud-Native-Development/docker-for-ai-services)
-   Capstone: Containerize Your API

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/49-docker-for-ai-services/08-capstone-containerize-your-api.md)

# Capstone: Containerize Your API

Throughout this chapter, you've built Docker knowledge step by step: container fundamentals, Dockerfile syntax, lifecycle management, multi-stage builds. Now it's time to apply everything to a real production scenario.

In Chapter 40, you built a Task API with SQLModel and Neon PostgreSQL. It works on your machine. But "works on my machine" doesn't ship products. Your teammates can't run it without matching your Python version, installing the same dependencies, and configuring their environment variables.

This capstone changes that. You'll write a specification FIRST, then containerize your API using the patterns from this chapter. The result: a portable container image that runs identically on your laptop, a teammate's machine, or a cloud server.

The specification-first approach is critical. Jumping straight to code is the Vibe Coding anti-pattern. Writing the spec first forces you to think about constraints (image size, security, configuration) before touching any Docker commands.

* * *

## Phase 1: Write the Specification FIRST

Before any implementation, you write a specification. This is the specification-first approach that separates professional development from Vibe Coding. The spec defines WHAT you're building and HOW you'll know it works.

Create `containerization-spec.md` in your project directory:

```
# Containerization Specification: Task API## IntentContainerize the SQLModel + Neon Task API for production deployment.**Business Goal**: Enable any developer to run this API without environment setup.**Technical Goal**: Create a portable, optimized container image that works anywhere Docker runs.## Constraints### Image Size- **Target**: Under 200MB final image- **Rationale**: Smaller images push/pull faster, reduce storage costs### Security- **Non-root user**: Container runs as unprivileged user- **Health check**: Built-in endpoint for orchestrator monitoring- **No secrets in image**: Database URL passed at runtime### Configuration- **DATABASE_URL**: Environment variable (not hardcoded)- **PORT**: Configurable, defaults to 8000### Base Image- **Choice**: python:3.12-alpine (small, secure)- **Alternative**: python:3.12-slim (if Alpine compatibility issues)## Success Criteria- [ ] Container builds successfully without errors- [ ] Image size under 200MB (verify with `docker images`)- [ ] All CRUD endpoints work when running containerized- [ ] Health check endpoint responds at `/health`- [ ] Container can connect to Neon database with provided DATABASE_URL- [ ] Image can be pushed to registry (Docker Hub or GHCR)- [ ] Image can be pulled and run on different machine- [ ] Container runs as non-root user## Non-Goals (What We're NOT Doing)- [ ] Docker Compose multi-service setup (separate lesson)- [ ] Kubernetes deployment (Chapter 50)- [ ] CI/CD automation (future topic)- [ ] GPU support (not needed for this API)## Dependencies- SQLModel Task API code from Chapter 40 Lesson 7- Neon PostgreSQL database with connection string- Docker Desktop installed and running- Registry account (Docker Hub or GitHub)
```

**Why specification first?**

Without a spec, you'd start typing `FROM python:3.12` and figure things out as you go. That's Vibe Coding. You might forget security constraints. You might not consider image size until it's 1.2GB. You might hardcode secrets.

The spec makes constraints explicit BEFORE you start. It's your contract with yourself.

* * *

## Phase 2: Prepare the Application

Before writing the Dockerfile, ensure your Task API code is ready for containerization.

**Your project should have this structure:**

```
task-api/├── main.py           # FastAPI application├── models.py         # SQLModel Task definition├── database.py       # Engine and session management├── config.py         # Settings with DATABASE_URL├── requirements.txt  # Dependencies└── containerization-spec.md  # The spec you just wrote
```

**Verify requirements.txt includes all dependencies:**

```
fastapi==0.115.0uvicorn==0.30.0sqlmodel==0.0.22psycopg2-binary==2.9.9pydantic-settings==2.5.2
```

**Update config.py to read DATABASE\_URL from environment:**

```
# config.pyfrom pydantic_settings import BaseSettingsfrom functools import lru_cacheclass Settings(BaseSettings):    database_url: str    class Config:        env_file = ".env"@lru_cachedef get_settings() -> Settings:    return Settings()
```

**Add a health check endpoint to main.py:**

```
# Add this to main.py (if not already present)@app.get("/health")def health_check():    """Health check endpoint for container orchestrators."""    return {"status": "healthy", "service": "task-api"}
```

**Output:**

```
{"status": "healthy", "service": "task-api"}
```

* * *

## Phase 3: Apply Multi-Stage Build Pattern

Now apply the multi-stage build pattern from Lesson 5. Reference your specification: under 200MB, Alpine base, non-root user.

Create `Dockerfile`:

```
# =============================================================================# Stage 1: Build Stage# Purpose: Install dependencies with build tools (discarded after build)# =============================================================================FROM python:3.12-alpine AS builderWORKDIR /app# Install UV for fast dependency installationRUN pip install --no-cache-dir uv# Copy requirements first (layer caching)COPY requirements.txt .# Install dependencies to user directoryRUN uv pip install --system --no-cache -r requirements.txt# =============================================================================# Stage 2: Runtime Stage# Purpose: Minimal production image with only necessary files# =============================================================================FROM python:3.12-alpineWORKDIR /app# Create non-root user for securityRUN adduser -D -u 1000 appuser# Copy installed packages from builderCOPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packagesCOPY --from=builder /usr/local/bin /usr/local/bin# Copy application codeCOPY main.py .COPY models.py .COPY database.py .COPY config.py .# Set ownership to non-root userRUN chown -R appuser:appuser /app# Switch to non-root userUSER appuser# Environment configurationENV PYTHONUNBUFFERED=1 \    PYTHONDONTWRITEBYTECODE=1# Expose port (documentation, doesn't publish)EXPOSE 8000# Health checkHEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \    CMD wget --no-verbose --tries=1 --spider http://localhost:8000/health || exit 1# Run the applicationCMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Key design decisions (trace back to spec):**

Spec Requirement

Dockerfile Implementation

Under 200MB

python:3.12-alpine base, multi-stage build

Non-root user

`adduser appuser`, `USER appuser`

Health check

HEALTHCHECK instruction with wget

No secrets in image

DATABASE\_URL passed at runtime via -e flag

Configurable port

Exposed via EXPOSE, configurable in CMD

* * *

## Phase 4: Build and Validate Locally

Build the image and validate against success criteria from your spec.

**Build the image:**

```
docker build -t task-api:v1 .
```

**Output:**

```
[+] Building 12.3s (15/15) FINISHED => [internal] load build definition from Dockerfile => [builder 1/4] FROM python:3.12-alpine => [builder 2/4] RUN pip install --no-cache-dir uv => [builder 3/4] COPY requirements.txt . => [builder 4/4] RUN uv pip install --system --no-cache -r requirements.txt => [stage-1 1/7] FROM python:3.12-alpine => [stage-1 2/7] COPY --from=builder /usr/local/lib/python... => exporting to image
```

**Check image size (spec: under 200MB):**

```
docker images task-api:v1
```

**Output:**

```
REPOSITORY   TAG   IMAGE ID       CREATED         SIZEtask-api     v1    a1b2c3d4e5f6   30 seconds ago  145MB
```

145MB is well under the 200MB target from your specification.

**Run the container with DATABASE\_URL:**

```
docker run -d \  -p 8000:8000 \  -e DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require" \  --name task-api-container \  task-api:v1
```

**Verify container is running:**

```
docker ps
```

**Output:**

```
CONTAINER ID   IMAGE        COMMAND                  STATUS          PORTSf7g8h9i0j1k2   task-api:v1  "uvicorn main:app..."   Up 10 seconds   0.0.0.0:8000->8000/tcp
```

**Test health check (spec: health endpoint responds):**

```
curl http://localhost:8000/health
```

**Output:**

```
{"status":"healthy","service":"task-api"}
```

**Test CRUD endpoints (spec: all endpoints work):**

```
# Create a taskcurl -X POST http://localhost:8000/tasks \  -H "Content-Type: application/json" \  -d '{"title": "Test containerized API"}'# List taskscurl http://localhost:8000/tasks
```

**Output:**

```
{"id":1,"title":"Test containerized API","description":null,"status":"pending","created_at":"2024-01-15T10:30:00"}
```

**Verify non-root user (spec: container runs as non-root):**

```
docker exec task-api-container whoami
```

**Output:**

```
appuser
```

* * *

## Phase 5: Push to Container Registry

Your image works locally. Now push it to a registry so anyone can pull and run it.

### Option A: Docker Hub

**Step 1: Log in to Docker Hub**

```
docker login
```

Enter your Docker Hub username and password when prompted.

**Step 2: Tag the image for your Docker Hub account**

```
docker tag task-api:v1 yourusername/task-api:v1docker tag task-api:v1 yourusername/task-api:latest
```

Replace `yourusername` with your actual Docker Hub username.

**Step 3: Push to Docker Hub**

```
docker push yourusername/task-api:v1docker push yourusername/task-api:latest
```

**Output:**

```
The push refers to repository [docker.io/yourusername/task-api]a1b2c3d4e5f6: Pushedb2c3d4e5f6a7: Pushedv1: digest: sha256:abc123... size: 1234
```

### Option B: GitHub Container Registry (GHCR)

**Step 1: Create a personal access token**

Go to GitHub Settings > Developer settings > Personal access tokens > Generate new token. Select `write:packages` scope.

**Step 2: Log in to GHCR**

```
echo $GITHUB_TOKEN | docker login ghcr.io -u yourusername --password-stdin
```

**Step 3: Tag and push**

```
docker tag task-api:v1 ghcr.io/yourusername/task-api:v1docker push ghcr.io/yourusername/task-api:v1
```

* * *

## Phase 6: Cross-Machine Validation

The ultimate test: can someone else run your container? This validates the spec requirement "Image can be pulled and run on different machine."

**On a different machine (or a cloud VM):**

**Step 1: Pull the image**

```
docker pull yourusername/task-api:v1
```

**Step 2: Run with your Neon DATABASE\_URL**

```
docker run -d \  -p 8000:8000 \  -e DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require" \  --name task-api \  yourusername/task-api:v1
```

**Step 3: Verify endpoints work**

```
curl http://localhost:8000/healthcurl http://localhost:8000/tasks
```

**What you just proved:**

"Works on my machine" is now "Works everywhere Docker runs." Your teammate doesn't need:

-   The same Python version
-   The same operating system
-   To run `pip install` for 50 packages
-   To configure environment variables manually

They run one command, and the entire environment is identical to yours.

* * *

## Specification Checklist: Final Validation

Go back to your specification and verify each success criterion:

Success Criterion

Status

Evidence

Container builds successfully

PASS

`docker build` completed without errors

Image size under 200MB

PASS

`docker images` shows 145MB

All CRUD endpoints work

PASS

curl commands return expected responses

Health check responds

PASS

`/health` returns `{"status":"healthy"}`

Connects to Neon database

PASS

Tasks persist across container restarts

Pushed to registry

PASS

Image visible on Docker Hub/GHCR

Runs on different machine

PASS

Pulled and executed successfully

Runs as non-root

PASS

`whoami` returns `appuser`

**All criteria met. Specification satisfied.**

* * *

## Common Issues and Solutions

### Issue: Container exits immediately

**Check logs:**

```
docker logs task-api-container
```

**Common causes:**

-   Missing DATABASE\_URL environment variable
-   Invalid database connection string
-   Python import errors

### Issue: Cannot connect to database

**Verify DATABASE\_URL is passed correctly:**

```
docker exec task-api-container env | grep DATABASE
```

**Ensure sslmode=require is present** (required for Neon):

```
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

### Issue: Health check failing

**Debug by running health check manually:**

```
docker exec task-api-container wget --spider http://localhost:8000/health
```

**Check if uvicorn started:**

```
docker logs task-api-container | head -20
```

### Issue: Permission denied errors

**Check if non-root user has access to files:**

```
docker exec task-api-container ls -la /app
```

All files should be owned by `appuser`.

* * *

## Try With AI

You've completed the capstone manually. Now extend your containerization skills through AI collaboration.

**Prompt 1: Specification Review**

```
Review my containerization specification for gaps:[Paste your containerization-spec.md content]Questions to consider:- What security constraints am I missing?- Should I add any non-goals to prevent scope creep?- What edge cases should my success criteria cover?
```

**What you're learning:** AI can review specifications and identify blind spots you might have missed. It might suggest constraints you hadn't considered, like secrets rotation, log aggregation, or graceful shutdown handling. You evaluate each suggestion against your project's actual needs.

**Prompt 2: Dockerfile Optimization**

```
Here's my production Dockerfile for a FastAPI + SQLModel service:[Paste your Dockerfile]Analyze it against these criteria:- Is the image as small as possible?- Are there security improvements I'm missing?- Is layer caching optimized for rebuild speed?Suggest specific improvements with explanations.
```

**What you're learning:** AI can identify optimization opportunities in your Dockerfile. It might suggest removing unused binaries, combining RUN commands, or using more specific COPY paths. You evaluate each suggestion against your specification constraints.

**Prompt 3: Tagging Strategy**

```
I'm pushing my task-api image to Docker Hub. Help me design a tagging strategy that includes:- Latest tag for convenience- Semantic version tags (v1.0.0, v1.1.0)- Git commit hash tags for traceabilityShow me the docker tag and docker push commands for this workflow.Explain when I would use each tag type.
```

**What you're learning:** Production registries need thoughtful tagging. `latest` is convenient but dangerous in production. Semantic versions communicate compatibility. Git hashes enable exact reproduction. AI helps you design a strategy that balances convenience and safety.

**Safety note:** When sharing specifications or Dockerfiles with AI, redact actual database credentials and sensitive configuration. Replace real values with placeholders like `user:pass` or `YOUR_CONNECTION_STRING`.

Checking access...

---

Source: https://agentfactory.panaversity.org/docs/06-AI-Cloud-Native-Development/49-docker-for-ai-services