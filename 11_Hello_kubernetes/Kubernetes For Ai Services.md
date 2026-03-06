# AI Cloud Native Development: Kubernetes For Ai Services

> Downloaded from Agent Factory on 3/6/2026
> Total lessons: 23

## Table of Contents

1. [Build Your Kubernetes Skill](#build-your-kubernetes-skill)
2. [Kubernetes Architecture and the Declarative Model](#kubernetes-architecture-and-the-declarative-model)
3. [Enabling Kubernetes (Docker Desktop)](#enabling-kubernetes-docker-desktop)
4. [Pods: The Atomic Unit](#pods-the-atomic-unit)
5. [Deployments: Self-Healing at Scale](#deployments-self-healing-at-scale)
6. [Services and Networking: Stable Access to Dynamic Pods](#services-and-networking-stable-access-to-dynamic-pods)
7. [Namespaces: Virtual Clusters for AI Workloads](#namespaces-virtual-clusters-for-ai-workloads)
8. [ConfigMaps and Secrets](#configmaps-and-secrets)
9. [Resource Management and Debugging](#resource-management-and-debugging)
10. [Horizontal Pod Autoscaler for AI Agents](#horizontal-pod-autoscaler-for-ai-agents)
11. [RBAC: Securing Your Agent Deployments](#rbac-securing-your-agent-deployments)
12. [Health Checks: Liveness, Readiness, Startup Probes](#health-checks-liveness-readiness-startup-probes)
13. [Jobs and CronJobs: Batch Workloads for AI Agents](#jobs-and-cronjobs-batch-workloads-for-ai-agents)
14. [AI-Assisted Kubernetes with kubectl-ai](#ai-assisted-kubernetes-with-kubectl-ai)
15. [Capstone: Deploy Your Part 6 Agent to Kubernetes](#capstone-deploy-your-part-6-agent-to-kubernetes)
16. [Test and Refine Your Kubernetes Skill](#test-and-refine-your-kubernetes-skill)
17. [Init Containers (Optional)](#init-containers-optional)
18. [Sidecar Containers (Optional)](#sidecar-containers-optional)
19. [Ingress: External Access (Optional)](#ingress-external-access-optional)
20. [Service Discovery Deep Dive (Optional)](#service-discovery-deep-dive-optional)
21. [StatefulSets (Optional)](#statefulsets-optional)
22. [Persistent Storage (Optional)](#persistent-storage-optional)
23. [Kubernetes Security Deep Dive (Optional)](#kubernetes-security-deep-dive-optional)

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 50: Kubernetes for AI Services](/docs/AI-Cloud-Native-Development/kubernetes-for-ai-services)
-   Build Your Kubernetes Skill

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/50-kubernetes-for-ai-services/00-build-your-kubernetes-skill.md)

# Build Your Kubernetes Skill

Before learning Kubernetes—orchestrating your containerized applications at scale—you'll **own** a Kubernetes skill.

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
Using your skill creator skill create a new skill for Kubernetes. I will useit to deploy and scale containerized applications from hello world to professionalproduction systems. Use context7 skill to study official documentation and thenbuild it so no self assumed knowledge.
```

Claude will:

1.  Fetch official Kubernetes documentation via Context7
2.  Ask you clarifying questions (resource limits, scaling patterns, health checks)
3.  Create the complete skill with references and templates

Your skill appears at `.claude/skills/kubernetes-deployment/`.

* * *

## Done

You now own a Kubernetes skill built from official documentation. The rest of this chapter teaches you what it knows—and how to make it better.

**Next: Lesson 1 — Kubernetes Architecture**

Checking access...

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 50: Kubernetes for AI Services](/docs/AI-Cloud-Native-Development/kubernetes-for-ai-services)
-   Kubernetes Architecture and the Declarative Model

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/50-kubernetes-for-ai-services/01-kubernetes-architecture-declarative-model.md)

# Kubernetes Architecture and the Declarative Model

Your FastAPI agent from Part 6 is now containerized. In Chapter 49, you packaged it into a Docker image—portable, reproducible, ready to run anywhere. But "anywhere" in production means dozens of servers, not your laptop.

Here's the problem: You run `docker run my-agent:v1` on one server. Great. Now what happens when:

-   That server crashes at 3 AM?
-   Traffic spikes and one container can't handle the load?
-   You need to deploy version v2 without dropping user requests?

With Docker alone, YOU are the "someone" who handles all of this manually. With Kubernetes, the cluster handles it automatically.

This lesson builds the mental model you need before running any kubectl commands: why orchestration exists, how Kubernetes thinks declaratively about state, and what happens inside a cluster when things go wrong.

* * *

## Why Docker Isn't Enough

In Chapter 49, you learned Docker's core value: package your application into an image, run it as a container anywhere. Docker solved the "it works on my machine" problem.

But Docker alone doesn't solve:

**1\. Multi-machine deployment**: `docker run` starts one container on one machine. Production needs containers across 10, 100, or 1000 machines.

**2\. Self-healing**: If a container crashes, Docker doesn't restart it automatically (unless you use restart policies—and even those are limited). Your application stays down until someone notices.

**3\. Scaling**: When traffic increases, you need more container copies. With Docker alone, you'd manually run `docker run` on multiple machines and somehow balance traffic between them.

**4\. Updates without downtime**: Deploying a new version means stopping the old container, then starting the new one. Users see an error during that gap.

**5\. Service discovery**: Your frontend needs to talk to your backend. Both are containers, but their IP addresses change every time they restart. How do they find each other?

### The Gap Between Docker and Production

```
Development (Docker alone)          Production (what you need)--------------------------          -------------------------One container, one laptop           100+ containers, many machinesManual restarts                     Automatic recoveryStatic configuration                Dynamic scalingDown during updates                 Zero-downtime deploymentsHard-coded IPs                      Automatic service discovery
```

Container orchestration fills this gap. Kubernetes is the industry standard for orchestrating containers at scale.

* * *

## The Declarative Model: You Describe WHAT, Kubernetes Figures Out HOW

The most important concept in Kubernetes is the **declarative model**.

### Imperative vs Declarative

**Imperative** (Docker-style): You give step-by-step instructions.

```
docker run nginx       # Step 1: Start nginxdocker run nginx       # Step 2: Start another nginxdocker run nginx       # Step 3: Start a third nginx# Wait, one crashed. Now I need to figure out which one and restart it.
```

**Declarative** (Kubernetes-style): You describe the end state you want.

```
apiVersion: apps/v1kind: Deploymentspec:  replicas: 3          # I want 3 nginx containers  template:    spec:      containers:      - name: nginx        image: nginx:1.25
```

You declare: "I want 3 nginx containers running." Kubernetes makes it happen. If one crashes, Kubernetes notices the mismatch (desired: 3, actual: 2) and creates a new one.

### Desired State vs Observed State

This is the core loop:

```
┌─────────────────────────────────────────┐│                                         ││  YOU: "I want 3 replicas"  (DESIRED)    ││           │                             ││           ▼                             ││  KUBERNETES: Observes 2 running (OBSERVED)│           │                             ││           ▼                             ││  MISMATCH DETECTED: 3 ≠ 2              ││           │                             ││           ▼                             ││  ACTION: Create 1 new replica           ││           │                             ││           ▼                             ││  OBSERVE AGAIN: Now 3 running          ││           │                             ││           ▼                             ││  MATCH: 3 = 3, no action needed        ││           │                             ││           └─────────────────────────────┘│                (loop continues)
```

This loop runs continuously. Kubernetes controllers are always watching, comparing desired to observed, and taking action to close the gap.

### Why This Matters

The declarative model means:

1.  **Self-healing is built-in**: Crashes create mismatches that controllers automatically fix.
2.  **Scaling is one number change**: Update `replicas: 3` to `replicas: 10`. Kubernetes handles the rest.
3.  **Rollbacks are instant**: Your previous desired state is stored. Reverting means pointing back to it.
4.  **Intent is documented**: Your YAML files describe what should exist. Version control them like code.

* * *

## Kubernetes Architecture: The Big Picture

A Kubernetes cluster has two types of machines:

```
┌─────────────────────────────────────────────────────────────┐│                     KUBERNETES CLUSTER                      │├──────────────────────────┬──────────────────────────────────┤│     CONTROL PLANE        │         WORKER NODES             ││                          │                                  ││  ┌──────────────────┐   │   ┌─────────────────────────┐   ││  │   API Server     │◄──┼───│  kubelet                │   ││  └────────┬─────────┘   │   │  (manages containers)   │   ││           │             │   └─────────────────────────┘   ││  ┌────────▼─────────┐   │                                  ││  │   Scheduler      │   │   ┌─────────────────────────┐   ││  │  (places Pods)   │   │   │  kube-proxy             │   ││  └────────┬─────────┘   │   │  (network routing)      │   ││           │             │   └─────────────────────────┘   ││  ┌────────▼─────────┐   │                                  ││  │  Controller      │   │   ┌─────────────────────────┐   ││  │  Manager         │   │   │  Container Runtime      │   ││  └────────┬─────────┘   │   │  (runs containers)      │   ││           │             │   └─────────────────────────┘   ││  ┌────────▼─────────┐   │                                  ││  │   etcd           │   │                                  ││  │  (cluster state) │   │                                  ││  └──────────────────┘   │                                  │├──────────────────────────┴──────────────────────────────────┤│  The "brains"            │  The "muscles"                   ││  Decides WHAT to do      │  Actually runs your containers   │└─────────────────────────────────────────────────────────────┘
```

**Control Plane**: The brains. Makes decisions about what should run where.

**Worker Nodes**: The muscles. Actually run your containers.

* * *

## Control Plane Components

The control plane runs on dedicated machines (or VMs) and manages the entire cluster.

### API Server

The front door to Kubernetes. Every operation—creating a deployment, scaling replicas, checking status—goes through the API server.

When you run `kubectl apply`, you're sending a request to the API server. When the dashboard shows your pods, it queried the API server.

The API server:

-   Validates incoming requests
-   Stores objects in etcd
-   Notifies controllers about changes

### etcd

A distributed key-value store that holds the cluster's state:

-   What deployments exist
-   How many replicas each should have
-   Pod configurations
-   Secrets and ConfigMaps

etcd is the single source of truth. If etcd loses data, you lose your cluster configuration.

### Scheduler

When you create a Pod, someone needs to decide which worker node runs it. That's the scheduler.

The scheduler considers:

-   **Resource availability**: Does the node have enough CPU and memory?
-   **Affinity rules**: Should this Pod run near (or far from) other Pods?
-   **Taints and tolerations**: Is the node restricted to certain workloads?

It doesn't start the Pod—it just assigns the Pod to a node. The kubelet on that node does the actual starting.

### Controller Manager

Controllers implement the reconciliation loop. Each controller watches specific resources:

-   **Deployment Controller**: Ensures the right number of ReplicaSets exist
-   **ReplicaSet Controller**: Ensures the right number of Pods exist
-   **Node Controller**: Monitors node health, marks nodes as unavailable when they stop responding
-   **Job Controller**: Manages batch jobs that run to completion

When a Pod crashes, the ReplicaSet controller detects the mismatch (desired vs observed) and creates a replacement.

* * *

## Worker Node Components

Worker nodes run your actual containers. Each node has three critical components.

### kubelet

The agent running on every worker node. It:

-   Receives Pod specifications from the API server
-   Tells the container runtime to start containers
-   Monitors container health
-   Reports status back to the API server

When you deploy a Pod, the scheduler assigns it to a node, and the kubelet on that node makes it happen.

### kube-proxy

Handles network routing on each node. When your frontend Pod needs to reach your backend Pod, kube-proxy manages the routing.

It implements Kubernetes Services—stable network endpoints that route to the right Pods even when Pod IPs change.

### Container Runtime

The software that actually runs containers. Kubernetes supports multiple runtimes:

-   **containerd**: Most common in production
-   **CRI-O**: Red Hat's container runtime
-   **Docker**: Was default, now deprecated as a runtime (though Docker-built images still work)

The kubelet talks to the container runtime through a standard interface (CRI—Container Runtime Interface), so Kubernetes doesn't care which runtime you use.

* * *

## The Reconciliation Loop: Kubernetes' Heartbeat

Everything in Kubernetes operates through reconciliation loops:

```
                    ┌────────────────────────────┐                    │                            │                    │  1. OBSERVE                │                    │     Check actual state     │                    │                            │                    └────────────┬───────────────┘                                 │                                 ▼                    ┌────────────────────────────┐                    │                            │                    │  2. COMPARE                │                    │     Actual vs Desired      │                    │                            │                    └────────────┬───────────────┘                                 │                    ┌────────────┴───────────────┐                    │                            │             ┌──────▼──────┐              ┌──────▼──────┐             │             │              │             │             │  Match:     │              │  Mismatch:  │             │  Do nothing │              │  Take action│             │             │              │             │             └──────┬──────┘              └──────┬──────┘                    │                            │                    │                            │                    └──────────┬─────────────────┘                               │                               ▼                    ┌────────────────────────────┐                    │                            │                    │  3. WAIT                   │                    │     Brief pause            │                    │                            │                    └────────────┬───────────────┘                                 │                                 └────────► (back to OBSERVE)
```

This loop runs constantly for every resource type. Here's what happens when you deploy:

1.  **You apply a Deployment manifest**: API server stores it in etcd.
2.  **Deployment controller notices**: A new Deployment exists with `replicas: 3`.
3.  **Deployment controller creates ReplicaSet**: Desired state: 3 Pods.
4.  **ReplicaSet controller notices**: 0 Pods exist, but 3 are desired.
5.  **ReplicaSet controller creates Pods**: 3 Pod objects in etcd.
6.  **Scheduler notices**: 3 Pods need nodes.
7.  **Scheduler assigns Pods to nodes**: Pod objects updated with node assignments.
8.  **kubelets notice**: Each kubelet sees a Pod assigned to its node.
9.  **kubelets start containers**: Actual containers running.
10.  **Observation continues**: All controllers keep watching for mismatches.

* * *

## What Happens When a Container Crashes?

Let's trace through a failure scenario:

1.  **Container exits** (application bug, out of memory, etc.)
2.  **kubelet detects the exit**: Marks the Pod as failed.
3.  **kubelet restarts the container**: Based on Pod's restart policy.
4.  **If container keeps crashing**: Pod enters `CrashLoopBackOff`.
5.  **ReplicaSet controller**: Sees desired 3, but one is unhealthy.
6.  **If Pod is terminated**: ReplicaSet creates a replacement Pod.
7.  **Scheduler assigns new Pod** to a node (possibly different than before).
8.  **kubelet starts new container**: Service restored.

All of this happens without human intervention. The reconciliation loop handles it.

* * *

## Core Terminology Summary

**Cluster**: A set of machines (nodes) running Kubernetes.

**Control Plane**: The components that manage the cluster (API server, scheduler, etcd, controller manager).

**Worker Node**: A machine that runs your containers.

**Pod**: The smallest deployable unit. Contains one or more containers.

**Deployment**: A higher-level resource that manages Pods through ReplicaSets.

**Desired State**: What you specify in YAML manifests.

**Observed State**: What actually exists in the cluster right now.

**Reconciliation**: The process of detecting mismatches and taking action.

**Controller**: A loop that watches resources and ensures desired state matches observed state.

* * *

## Mental Model: Kubernetes as an Operating System

Think of Kubernetes as an operating system for containers:

Traditional OS

Kubernetes

Manages one machine

Manages many machines

Schedules processes

Schedules containers

Process dies → restart

Container dies → restart + reschedule

Networking between processes

Networking between containers

File systems

Persistent volumes

Environment variables

ConfigMaps and Secrets

The key difference: a traditional OS manages one machine. Kubernetes manages a fleet of machines as a single system.

* * *

## Try With AI

Before moving to hands-on work, solidify your understanding with these prompts:

**Prompt 1: Test your declarative model understanding**

Ask AI: "I have a Kubernetes Deployment with replicas: 3. One Pod crashes and gets stuck in CrashLoopBackOff. Explain what each Kubernetes component does in response."

Expected answer should mention: kubelet detects crash, restarts container, ReplicaSet controller monitors Pod status, scheduler not involved unless Pod is fully terminated.

**Prompt 2: Control plane vs worker nodes**

Ask AI: "If I have 3 worker nodes and the control plane node goes down, what happens to my running containers? What can't I do anymore?"

Expected answer: Running containers continue (kubelet keeps them alive), but you can't deploy new workloads, scale, or make changes (no API server).

**Prompt 3: Why etcd matters**

Ask AI: "If etcd loses all its data in a Kubernetes cluster, what happens? What's lost?"

Expected answer: Cluster state is lost—all Deployments, Services, ConfigMaps, Secrets. Running containers might continue but can't be managed. This is why etcd backups are critical.

**Prompt 4: Reconciliation in practice**

Ask AI: "I change my Deployment from replicas: 3 to replicas: 5. Walk me through exactly which controllers notice and what actions they take."

Expected answer should trace: Deployment controller creates/updates ReplicaSet, ReplicaSet controller sees 3 Pods but wants 5, creates 2 Pod objects, scheduler assigns them, kubelets start containers.

**Prompt 5: Kubernetes vs Docker**

Ask AI: "My teammate says 'just use Docker Compose for production.' What's missing compared to Kubernetes?"

Expected answer: Multi-machine orchestration, automatic failover across nodes, rolling updates across a fleet, service discovery at scale, built-in load balancing.

* * *

## Reflect on Your Skill

You built a `kubernetes-deployment` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my kubernetes-deployment skill, explain the reconciliation loop.Does my skill describe how the Deployment controller, ReplicaSet controller, and Scheduler work together?
```

### Identify Gaps

Ask yourself:

-   Did my skill include the declarative model (desired vs observed state)?
-   Did it explain the control plane components and their responsibilities?
-   Did it cover the worker node components (kubelet, kube-proxy, container runtime)?

### Improve Your Skill

If you found gaps:

```
My kubernetes-deployment skill is missing explanations of the reconciliation loop and component responsibilities.Update it to include how the API server, scheduler, controller manager, and etcd collaborate to maintain desired state.
```

* * *

Checking access...

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 50: Kubernetes for AI Services](/docs/AI-Cloud-Native-Development/kubernetes-for-ai-services)
-   Enabling Kubernetes (Docker Desktop)

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/50-kubernetes-for-ai-services/02-enabling-kubernetes-docker-desktop.md)

# Enabling Kubernetes (Docker Desktop)

You already have Docker Desktop from Chapter 49. Here's the good news: Kubernetes is built in. No separate installation, no virtual machines, no complex setup. Just a checkbox.

By the end of this lesson, you'll have a working Kubernetes cluster running on your laptop—the same API and concepts used in production cloud deployments—ready for your first Pod deployment.

* * *

## Docker Desktop Kubernetes vs Cloud Kubernetes

Feature

Docker Desktop

Cloud Kubernetes (GKE, EKS, AKS)

**Location**

Your laptop

Cloud data center

**Nodes**

Single node

Multiple nodes

**Cost**

Free

Cloud compute bills

**Setup**

One checkbox

Cloud provider configuration

**API**

Identical Kubernetes API

Same API

**kubectl**

Same commands

Same commands

**Key insight**: Docker Desktop Kubernetes is NOT a toy. It's a real Kubernetes cluster with the same API as production. Everything you learn here transfers directly to cloud deployments.

* * *

## Enable Kubernetes

### Step 1: Open Docker Desktop Settings

-   macOS
-   Windows
-   Linux

Click the Docker icon in your menu bar → **Settings** (or press `⌘,`)

Right-click the Docker icon in the system tray → **Settings**

Click the Docker Desktop icon → **Settings**

### Step 2: Enable Kubernetes

1.  In Settings, click **Kubernetes** in the left sidebar
2.  Check **Enable Kubernetes**
3.  Click **Apply & Restart**

Docker Desktop will download Kubernetes components and start the cluster. This takes 2-3 minutes on first enable.

**What you'll see**:

-   A progress indicator while Kubernetes initializes
-   Docker Desktop restarts
-   A green "Kubernetes running" indicator in the bottom-left corner

### Step 3: Verify Kubernetes is Running

Open a terminal and run:

```
kubectl version
```

**Output**:

```
Client Version: v1.28.2Kustomize Version: v5.0.4-0.20230601165947-6ce0bf390ce3Server Version: v1.28.2
```

Both Client and Server versions should display. If Server Version is missing, Kubernetes isn't running yet—wait for the green indicator in Docker Desktop.

* * *

## Verify Your Cluster

Check that your cluster is healthy:

```
kubectl cluster-info
```

**Output**:

```
Kubernetes control plane is running at https://kubernetes.docker.internal:6443CoreDNS is running at https://kubernetes.docker.internal:6443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxyTo further debug and diagnose cluster problems, use 'kubectl cluster-info dump'.
```

This shows:

-   **Control plane**: API server is running
-   **CoreDNS**: Service discovery is working (pods can find each other by name)

Check the nodes in your cluster:

```
kubectl get nodes
```

**Output**:

```
NAME             STATUS   ROLES           AGE   VERSIONdocker-desktop   Ready    control-plane   5m    v1.28.2
```

This shows:

-   **NAME**: Your single node is called "docker-desktop"
-   **STATUS**: Ready (healthy, accepting workloads)
-   **ROLES**: control-plane (runs both control plane and worker responsibilities)
-   **VERSION**: Kubernetes v1.28.2

Your Kubernetes cluster is running and ready.

* * *

## Understanding kubectl Context

kubectl needs to know which Kubernetes cluster to talk to. This is managed through **contexts**.

### What is a Context?

A context combines:

-   **Cluster**: Which Kubernetes cluster to talk to
-   **User**: What credentials to use
-   **Namespace**: Which namespace to use (default is `default`)

### Check Your Current Context

```
kubectl config current-context
```

**Output**:

```
docker-desktop
```

This confirms kubectl is pointing to your Docker Desktop Kubernetes cluster.

### View All Contexts

```
kubectl config get-contexts
```

**Output**:

```
CURRENT   NAME             CLUSTER          AUTHINFO         NAMESPACE*         docker-desktop   docker-desktop   docker-desktop
```

The `*` marks your current context. If you later work with cloud clusters (GKE, EKS, AKS), you'll see multiple contexts here and can switch between them:

```
kubectl config use-context docker-desktop
```

### Where is This Stored?

Context configuration lives in `~/.kube/config`:

```
cat ~/.kube/config
```

**Output** (partial):

```
apiVersion: v1clusters:- cluster:    certificate-authority-data: LS0tLS1...    server: https://kubernetes.docker.internal:6443  name: docker-desktopcontexts:- context:    cluster: docker-desktop    user: docker-desktop  name: docker-desktopcurrent-context: docker-desktopkind: Configusers:- name: docker-desktop  user:    client-certificate-data: LS0tLS1...    client-key-data: LS0tLS1...
```

Docker Desktop automatically configures this when you enable Kubernetes.

* * *

## Quick Reference: Cluster Management

### Check Kubernetes Status

Look for the green "Kubernetes running" indicator in Docker Desktop's bottom-left corner. Or run:

```
kubectl get nodes
```

### Restart Kubernetes

If Kubernetes becomes unresponsive:

1.  Docker Desktop Settings → Kubernetes
2.  Click **Reset Kubernetes Cluster**

This resets the cluster to a clean state (removes all deployments).

### Disable Kubernetes

To free up resources when not using Kubernetes:

1.  Docker Desktop Settings → Kubernetes
2.  Uncheck **Enable Kubernetes**
3.  Click **Apply & Restart**

Re-enable anytime with the same checkbox.

### Resource Allocation

Docker Desktop shares resources with Kubernetes. Adjust in:

-   Docker Desktop Settings → Resources
-   Recommended: At least 4GB memory for Kubernetes workloads

* * *

## What You've Accomplished

You now have:

-   ✅ Kubernetes enabled in Docker Desktop
-   ✅ kubectl configured and communicating with your cluster
-   ✅ A working single-node Kubernetes cluster (same API as production)
-   ✅ Understanding of kubectl contexts

No VMs. No drivers. No hypervisors. Just a checkbox.

Your local Kubernetes cluster is ready. Next lesson, you'll deploy your first Pod to this cluster.

* * *

## Try With AI

Now that your cluster is running, explore it with AI assistance.

### Prompt 1: Cluster Architecture

```
I just enabled Kubernetes in Docker Desktop. When I run 'kubectl get nodes',I see 'docker-desktop' with role 'control-plane'.In the previous lesson, you explained that production Kubernetes has separatecontrol plane and worker nodes. How does Docker Desktop handle this with asingle node? What components are running?
```

**What you're learning**: How Docker Desktop combines control plane and worker responsibilities on a single node, and what Kubernetes components are actually running.

### Prompt 2: Context Management

```
I want to understand kubectl contexts better. I ran 'kubectl config get-contexts'and see 'docker-desktop'.If I later add a cloud cluster (like GKE), how would I:1. Add the new context?2. Switch between local and cloud clusters?3. Avoid accidentally deploying to production?
```

**What you're learning**: How professionals manage multiple Kubernetes environments safely, preventing accidental production deployments.

### Prompt 3: Resource Planning

```
I'm about to deploy AI agents to my Docker Desktop Kubernetes cluster.My laptop has 16GB RAM and Docker Desktop is allocated 8GB.How much of that 8GB is available for my workloads? What happens if mypods request more memory than available? How should I plan resourcerequests for AI workloads?
```

**What you're learning**: Resource management fundamentals—the relationship between node capacity, allocatable resources, and pod requests/limits that you'll configure in later lessons.

* * *

## Reflect on Your Skill

You built a `kubernetes-deployment` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my kubernetes-deployment skill, verify Kubernetes cluster health.Does my skill include commands like kubectl cluster-info and kubectl get nodes?
```

### Identify Gaps

Ask yourself:

-   Did my skill include kubectl context management?
-   Did it explain how to verify metrics-server and cluster components are running?
-   Did it cover the kubeconfig file and context switching?

### Improve Your Skill

If you found gaps:

```
My kubernetes-deployment skill is missing cluster verification and context management commands.Update it to include kubectl cluster-info, kubectl get nodes, kubectl config current-context, and kubeconfig management.
```

* * *

Checking access...

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 50: Kubernetes for AI Services](/docs/AI-Cloud-Native-Development/kubernetes-for-ai-services)
-   Pods: The Atomic Unit

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/50-kubernetes-for-ai-services/03-pods-the-atomic-unit.md)

# Pods: The Atomic Unit

Your Docker Desktop Kubernetes cluster is running. Now let's deploy something to it.

In Docker, you ran `docker run my-agent:v1` to start a container. In Kubernetes, you don't run containers directly—you create **Pods**. A Pod wraps one or more containers and adds the production features Kubernetes needs: shared networking, health management, resource guarantees, and co-location for tightly coupled processes.

This lesson teaches you to write Pod manifests by hand, deploy them with `kubectl apply`, and inspect them with `kubectl describe` and `kubectl logs`. By the end, you'll have deployed your first workload to Kubernetes and understand why Pods (not containers) are the atomic unit of deployment.

* * *

## What Is a Pod? (Beyond the Container)

### Docker vs Kubernetes Thinking

When you worked with Docker, you thought in containers:

```
┌─────────────────┐│   Container A   ││  (your app)     │└─────────────────┘
```

When you work with Kubernetes, you think in Pods:

```
┌─────────────────────────────┐│        Pod                  ││  ┌─────────────────────┐   ││  │   Container A       │   ││  │  (your app)         │   ││  └─────────────────────┘   ││  - Shared network ns        ││  - Shared volumes           ││  - Lifecycle mgmt           ││  - Ephemeral IP             │└─────────────────────────────┘
```

### A Closer Analogy

Think of a Pod like an **apartment**:

-   The apartment (Pod) is the unit Kubernetes deploys
-   Containers are like roommates inside the apartment
-   Roommates share the kitchen (network namespace)
-   Roommates share the bathroom (storage volumes)
-   The apartment has an address (IP address)
-   When the apartment is evicted, all roommates leave together

**Key Insight**: Roommates can't coordinate at 2 AM from separate apartments. They're in the same apartment for a reason. Similarly, containers in a Pod are co-located because they need tight coordination.

### Pod Networking: Localhost Just Works

The most counterintuitive feature of Pods: **Containers in the same Pod share localhost.**

If you have two containers in one Pod:

-   Container A listens on `localhost:8080`
-   Container B can reach it at `localhost:8080` (not `container-a-host:8080`)

This works because containers share the Pod's network namespace. There's no bridge or service discovery needed for intra-Pod communication—they're literally on the same network interface.

* * *

## Concept 1: Pod Manifests in YAML

Kubernetes uses declarative YAML manifests instead of imperative Docker commands. Instead of:

```
docker run nginx:alpine -p 8080:80
```

You write a manifest describing what you want:

```
apiVersion: v1kind: Podmetadata:  name: nginx-pod  labels:    app: nginx    tier: frontendspec:  containers:  - name: nginx    image: nginx:alpine    ports:    - containerPort: 80    resources:      limits:        memory: "128Mi"        cpu: "500m"      requests:        memory: "64Mi"        cpu: "250m"
```

### Field Breakdown

**apiVersion & kind**: Kubernetes API version and resource type

-   `v1` = stable core API
-   `Pod` = we're creating a Pod

**metadata**: Identification and labeling

-   `name`: Must be unique in the namespace
-   `labels`: Arbitrary key-value pairs for organization (not unique)
    -   Use labels to tag Pods (dev/prod, frontend/backend, etc.)

**spec.containers**: What actually runs

-   `name`: Container identifier within the Pod
-   `image`: Docker image (from Docker Hub or private registry)
-   `ports`: Which container ports Kubernetes should expose
    -   Note: This is declarative—it documents intention but doesn't bind ports to the host

**resources**: CPU and memory guarantees

-   `limits`: Maximum resources container can use
    -   If container exceeds limit, Kubernetes kills it
-   `requests`: Guaranteed minimum resources
    -   Used for scheduling decisions (place Pod on nodes with available resources)

### Why YAML, Not Docker Commands?

YAML enables:

1.  **Version control**: Check manifests into Git, track changes
2.  **Reproducibility**: Same manifest → same Pod every time
3.  **Infrastructure as code**: Automation and policy checking
4.  **GitOps**: Push code, Git webhook triggers deployment

This is the shift from imperative (Docker: "run this") to declarative (Kubernetes: "this should exist").

* * *

## Concept 2: Deploying a Pod with kubectl

Create a file `nginx-pod.yaml` with the manifest above, then:

```
kubectl apply -f nginx-pod.yaml
```

**Output:**

```
pod/nginx-pod created
```

This tells Kubernetes: "Make sure this Pod exists. If it doesn't, create it. If it does but the spec changed, update it."

### Verifying Deployment

Check if the Pod was created:

```
kubectl get pods
```

**Output:**

```
NAME        READY   STATUS    RESTARTS   AGEnginx-pod   1/1     Running   0          12s
```

Columns explained:

-   **NAME**: Pod name from metadata
-   **READY**: `1/1` means 1 container requested, 1 container running
-   **STATUS**: Current state (Pending, Running, Succeeded, Failed, etc.)
-   **RESTARTS**: How many times container crashed and restarted
-   **AGE**: How long this Pod has been alive

* * *

## Concept 3: Pod Lifecycle States

When you create a Pod, it doesn't run instantly. Kubernetes goes through several states:

```
Pending → Running → (Succeeded or Failed)
```

### State Breakdown

**Pending**: Pod created but not yet running

-   Kubernetes is scheduling (finding a node)
-   Container image is being pulled
-   Pod waiting for volumes to attach
-   Duration: Usually under 30 seconds, but can be longer if image is large or cluster is full

**Running**: At least one container is running

-   Pod is on a node
-   Health checks starting
-   Your application is active

**Succeeded**: All containers completed successfully

-   Only for batch Jobs (not long-running services)
-   Pod stops running

**Failed**: At least one container failed

-   Container exited with non-zero status
-   Pod won't restart (unless you configure RestartPolicy)

### Viewing State Transitions

Watch a Pod's journey from creation to running:

```
kubectl get pods -w
```

The `-w` flag means "watch"—stream updates as they happen.

* * *

## Concept 4: Inspecting Pods in Detail

### Getting More Information: kubectl describe

```
kubectl describe pod nginx-pod
```

**Output** (abbreviated):

```
Name:         nginx-podNamespace:    defaultPriority:     0Node:         worker-node-2Start Time:   Mon, 22 Dec 2025 14:30:15 +0000Status:       RunningIP:           10.244.1.52IPs:  IP:  10.244.1.52Containers:  nginx:    Container ID:   containerd://abc123...    Image:          nginx:alpine    Image ID:       docker.io/library/nginx@sha256:...    Port:           80/TCP    State:          Running      Started:      Mon, 22 Dec 2025 14:30:20 +0000    Ready:          True    Restart Count:  0    Limits:      cpu:      500m      memory:   128Mi    Requests:      cpu:      250m      memory:   64MiEvents:  Type    Reason     Age    From               Message  ----    ------     ----   ----               -------  Normal  Scheduled  1m     default-scheduler  Successfully assigned default/nginx-pod to worker-node-2  Normal  Pulling    1m     kubelet            Pulling image "nginx:alpine"  Normal  Pulled     45s    kubelet            Successfully pulled image "nginx:alpine"  Normal  Created    45s    kubelet            Created container nginx  Normal  Started    45s    kubelet            Started container nginx
```

**Key information**:

-   **IP**: Unique IP within cluster (ephemeral—changes if Pod restarts)
-   **Node**: Which worker node the Pod landed on
-   **Containers**: Detailed status of each container
-   **Events**: Timeline of what happened (scheduling, image pull, start)

### Reading Logs

See what your application is outputting:

```
kubectl logs nginx-pod
```

**Output** (nginx startup logs):

```
/docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to apply all files in /docker-entrypoint.d/:/docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/:/docker-entrypoint.sh: Launching /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh10-listen-on-ipv6-by-default.sh: info: Getting the checksum of /etc/nginx/conf.d/default.conf10-listen-on-ipv6-by-default.sh: info: Enabled ipv6 for in /etc/nginx/conf.d/default.conf/docker-entrypoint.sh: Launching /docker-entrypoint.d/20-envsubst-on-templates.sh/docker-entrypoint.sh: Launching /docker-entrypoint.d/30-tune-worker-processes.sh2025-12-22T14:30:20.531919Z 0 notice: signal process started
```

For multi-container Pods, view logs from a specific container:

```
kubectl logs nginx-pod -c nginx
```

* * *

## Concept 5: Pod Networking Deep Dive

### Each Pod Gets a Unique IP

When Kubernetes creates your Pod, it assigns an IP address from the cluster network (usually 10.0.0.0/8):

```
Pod A: 10.244.1.52Pod B: 10.244.2.104Pod C: 10.244.1.53
```

These IPs are **ephemeral**—they change when the Pod restarts. This is critical:

**❌ WRONG**: Store Pod IPs in configuration files **✅ RIGHT**: Use Kubernetes Services (next lesson) for stable networking

### How Containers in Same Pod Communicate

Create a Pod with two containers (web app and log shipper):

```
apiVersion: v1kind: Podmetadata:  name: multi-container-podspec:  containers:  - name: web    image: nginx:alpine    ports:    - containerPort: 8080  - name: log-shipper    image: filebeat:latest    # log-shipper can reach web at localhost:8080
```

The log-shipper can reach the web container at `localhost:8080` because they share the Pod's network namespace.

### Network Namespaces Visualized

```
┌──────────────────────────────────────────────┐│  Pod "multi-container-pod"                   ││                                              ││  Network namespace: 10.244.1.52              ││  ├─ eth0: 10.244.1.52                        ││  ├─ loopback: 127.0.0.1                      ││                                              ││  ┌──────────────┐  ┌──────────────┐         ││  │ Container    │  │ Container    │         ││  │ (web)        │  │ (log-ship)   │         ││  │              │  │              │         ││  │ Listen: 8080 │  │ Connect:     │         ││  │              │  │ localhost:80 │         ││  └──────────────┘  └──────────────┘         ││                                              │└──────────────────────────────────────────────┘
```

Both containers see:

-   Same hostname
-   Same localhost
-   Same network interface (eth0)
-   Access to shared volumes

* * *

## Concept 6: Single vs Multi-Container Pods

### Single-Container Pods (Most Common)

Most Pods contain one container:

```
apiVersion: v1kind: Podmetadata:  name: api-podspec:  containers:  - name: api    image: myapp:1.0
```

This is the common case. One container = one concern.

### Multi-Container Pods (Sidecar Pattern)

Two containers in one Pod when they need tight coupling:

**Use case 1: Log Shipper Sidecar**

Main container writes logs to stdout. Sidecar ships logs somewhere:

```
apiVersion: v1kind: Podmetadata:  name: app-with-loggingspec:  containers:  - name: app    image: myapp:1.0    volumeMounts:    - name: logs      mountPath: /var/log  - name: log-shipper    image: filebeat:latest    volumeMounts:    - name: logs      mountPath: /var/log  volumes:  - name: logs    emptyDir: {}  # Temporary volume shared between containers
```

Both containers share the `logs` volume. App writes to `/var/log`, log-shipper reads from `/var/log`.

**Use case 2: Init Container (Setup)**

An init container runs before main containers:

```
apiVersion: v1kind: Podmetadata:  name: app-with-initspec:  initContainers:  - name: setup    image: setup-script:1.0    # Runs first, sets up environment  containers:  - name: app    image: myapp:1.0    # Runs after init container completes
```

Init containers always complete before app containers start.

### When NOT to Use Multi-Container Pods

Don't force unrelated containers into one Pod:

**❌ WRONG**:

```
containers:  - name: web-api    image: api:1.0  - name: database    image: postgres:15    # These don't belong together!
```

Each should be its own Pod. Multi-container is for **tightly coupled** responsibilities (logging, monitoring, security).

* * *

## Concept 7: Pod Lifecycle: Creation to Termination

### Full Pod Lifecycle

```
1. kubectl apply -f pod.yaml   ↓2. Kubernetes creates Pod object (status: Pending)   ↓3. Scheduler assigns Pod to a Node (status: Pending)   ↓4. Kubelet on Node pulls image (status: Pending)   ↓5. Kubelet starts container (status: Running)   ↓6. App is ready to serve traffic   ↓7. Pod continues running until:   - Container exits (Failed state)   - kubectl delete pod (terminated)   - Node shuts down (evicted)   ↓8. Pod is gone, IP is reclaimed
```

### RestartPolicy: What Happens When Container Crashes

When a container exits, Kubernetes decides what to do based on RestartPolicy:

```
apiVersion: v1kind: Podmetadata:  name: app-with-restart-policyspec:  restartPolicy: Always  # Always restart on exit  containers:  - name: app    image: myapp:1.0
```

**RestartPolicy options**:

-   `Always`: Restart container if it exits (default)
    -   Useful for long-running services
-   `OnFailure`: Restart only if exit code was non-zero
    -   Useful for batch jobs that might fail temporarily
-   `Never`: Don't restart
    -   Useful for one-shot jobs

* * *

## Concept 8: Pods Are Mortal (Ephemeral Design)

**Critical insight**: Pods are NOT pets. They're cattle.

When a Pod terminates:

-   IP address is gone
-   Data in the Pod is lost (unless stored on a persistent volume)
-   Kubernetes does NOT automatically restart it (unless it's managed by a higher-level controller like Deployment—covered in next lesson)

```
kubectl delete pod nginx-pod
```

**Output:**

```
pod "nginx-pod" deleted
```

The Pod is **gone**. It doesn't come back unless:

1.  You manually create it again with `kubectl apply`
2.  It's managed by a Deployment/StatefulSet/Job that respawns it automatically

### Implications for Data

**❌ WRONG**:

```
containers:- name: app  image: myapp:1.0  # Storing important data here? LOST when Pod dies!
```

**✅ RIGHT**:

```
containers:- name: app  image: myapp:1.0  volumeMounts:  - name: data    mountPath: /datavolumes:- name: data  persistentVolumeClaim:    claimName: my-data-pvc  # Persists beyond Pod lifecycle
```

* * *

## Concept 9: Resource Requests vs Limits

You saw this in the manifest earlier. It's critical for production:

```
resources:  requests:    memory: "64Mi"    cpu: "250m"  limits:    memory: "128Mi"    cpu: "500m"
```

### Requests: Guaranteed Resources

`requests` tells Kubernetes: "This Pod needs at least this much."

Kubernetes uses requests to **schedule** (place Pods on nodes with available capacity):

```
Node 1 (4 CPU, 8Gi memory):  - Pod A requests 1 CPU, 2Gi → Scheduled here  - Pod B requests 1 CPU, 2Gi → Scheduled here  - Pod C requests 2 CPU, 4Gi → Not enough space, goes to Node 2
```

Without requests, Kubernetes can overcommit (overload a node).

### Limits: Hard Ceiling

`limits` tells Kubernetes: "This Pod can use at most this much."

If container exceeds limits, Kubernetes **kills it**:

```
Container uses 200Mi memory (limit: 128Mi)  → Out of Memory (OOM)  → Kubernetes kills container  → If restartPolicy is Always, restarts it  → If keeps hitting OOM, Pod enters CrashLoopBackOff
```

### Best Practice Settings

For most applications:

-   `requests.memory` = typical memory usage
-   `requests.cpu` = typical CPU usage
-   `limits.memory` = requests × 1.5 (allow spikes)
-   `limits.cpu` = requests × 2 (allow temporary spikes)

Example for a Python FastAPI app:

```
resources:  requests:    memory: "256Mi"    cpu: "500m"  limits:    memory: "512Mi"    cpu: "1000m"
```

* * *

## Hands-On Exercise: Create and Manage a Pod

### Step 1: Write a Pod Manifest

Create file `hello-api.yaml`:

```
apiVersion: v1kind: Podmetadata:  name: hello-api  labels:    app: hello    version: v1spec:  containers:  - name: api    image: python:3.11-alpine    command: ["python", "-m", "http.server", "8000"]    ports:    - containerPort: 8000    resources:      requests:        memory: "32Mi"        cpu: "100m"      limits:        memory: "64Mi"        cpu: "200m"
```

### Step 2: Deploy the Pod

```
kubectl apply -f hello-api.yaml
```

**Output:**

```
pod/hello-api created
```

### Step 3: Check Status

```
kubectl get pods
```

**Output:**

```
NAME        READY   STATUS    RESTARTS   AGEhello-api   1/1     Running   0          8s
```

### Step 4: Inspect Details

```
kubectl describe pod hello-api
```

Look for:

-   IP address assigned
-   Node it's running on
-   Events showing creation timeline

### Step 5: View Logs

```
kubectl logs hello-api
```

**Output:**

```
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

### Step 6: Simulate a Pod Restart

Stop the Pod:

```
kubectl delete pod hello-api
```

**Output:**

```
pod "hello-api" deleted
```

Notice: No Pod respawns. It's gone permanently.

Why? Because we created it directly. In real deployments, you'd use a **Deployment** (next lesson) that automatically respawns Pods when they fail.

* * *

## Common Mistakes and How to Avoid Them

### Mistake 1: Storing Important Data in Pods

**❌ WRONG**:

```
containers:- name: app  image: myapp:1.0  # If Pod dies, database is lost
```

**✅ RIGHT**: Use persistent volumes or external databases (PostgreSQL in Cloud SQL, etc.)

### Mistake 2: Ignoring Resource Limits

**❌ WRONG**:

```
containers:- name: app  image: myapp:1.0  # No limits = possible node overload
```

**✅ RIGHT**: Always set requests and limits based on actual application needs.

### Mistake 3: Hard-Coding Pod IPs

**❌ WRONG**:

```
# In your app codebackend_url = "10.244.1.52:8000"  # This IP changes!
```

**✅ RIGHT**: Use Kubernetes Services (next lesson) for stable DNS names.

### Mistake 4: Multi-Container Pods for Unrelated Services

**❌ WRONG**:

```
containers:- name: web  image: nginx:latest- name: postgres  image: postgres:15  # Completely unrelated!
```

**✅ RIGHT**: Create separate Pods for separate services. Only use multi-container for tight coupling (sidecars).

* * *

## Try With AI

Now that you understand Pods manually, explore deeper questions with AI:

**Part 1: Pod Architecture**

Ask AI: "Why would I run multiple containers in the same Pod instead of creating separate Pods? Give me 3 real-world examples."

Expected: AI should explain sidecar patterns (logging, monitoring, security sidecar) and why tight network coupling matters.

**Part 2: Networking Implications**

Ask AI: "In a Pod with two containers, Container A listens on port 8080 and Container B tries to reach it—what's the address that Container B should use?"

Expected: AI should explain that localhost:8080 works because they share the network namespace.

**Part 3: Lifecycle and Persistence**

Ask AI: "I deployed a Pod that crashed. The Pod is gone. How is this different from a Docker container that exited? What solves the 'Pod keeps crashing but doesn't respawn' problem?"

Expected: AI should explain ephemeral nature of Pods, mention Deployments as the solution for automatic respawning.

**Part 4: Resource Limits**

Ask AI: "My application uses about 200Mi of memory under normal load. What values should I set for memory `requests` and `limits`? Why are they different?"

Expected: AI should explain the distinction (requests for scheduling, limits for hard ceiling) and suggest reasonable safety margins.

* * *

## Reflect on Your Skill

You built a `kubernetes-deployment` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my kubernetes-deployment skill, create a Pod manifest with resource requests and limits.Does my skill generate proper YAML with requests and limits for CPU and memory?
```

### Identify Gaps

Ask yourself:

-   Did my skill include the Pod manifest structure (apiVersion, kind, metadata, spec)?
-   Did it explain resource requests vs limits and their impact on scheduling?
-   Did it cover multi-container Pods and the sidecar pattern?
-   Did it explain Pod networking (shared network namespace, localhost communication)?

### Improve Your Skill

If you found gaps:

```
My kubernetes-deployment skill is missing Pod manifest structure and resource management details.Update it to include proper YAML structure, resource requests/limits, multi-container patterns, and Pod networking fundamentals.
```

* * *

Checking access...

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 50: Kubernetes for AI Services](/docs/AI-Cloud-Native-Development/kubernetes-for-ai-services)
-   Deployments: Self-Healing at Scale

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/50-kubernetes-for-ai-services/04-deployments-self-healing-at-scale.md)

# Deployments: Self-Healing at Scale

Delete the Pod you created in Lesson 3:

```
kubectl delete pod nginx-pod
```

**Output:**

```
pod "nginx-pod" deleted
```

Now check if it came back:

```
kubectl get pods
```

**Output:**

```
No resources found in default namespace.
```

It didn't come back. That's the problem with bare Pods—they're mortal. Delete one, it's gone forever. Your application is down until you manually recreate it.

**Deployments** fix this. A Deployment is a manager that continuously monitors your Pods and ensures the desired count always exists. Delete a Pod? The Deployment creates a replacement. Node crashes? Pods get rescheduled elsewhere. This lesson teaches you to declare WHAT you want (3 replicas of your agent), and let Kubernetes handle HOW to maintain it.

* * *

## The Problem with Direct Pod Deployment

Direct Pod deployment is like hiring workers without a manager. You manage each worker individually:

-   Worker 1 quits? Hire someone new.
-   Need more workers? Interview and hire each one.
-   Want to update their uniforms? Replace each worker one at a time.

This manual approach doesn't scale.

### Why Pods Are Ephemeral

Recall from Lesson 2 that Pods are the smallest deployable unit in Kubernetes. But Pods have a critical limitation: **they are designed to be ephemeral (temporary)**.

A Pod can be deleted, evicted, or crash at any time:

```
Pod lifecycle:┌──────┐    ┌────────┐    ┌──────────┐    ┌──────┐│Pending│ → │ Running│ → │Succeeded │ → │Deleted│└──────┘    └────────┘    │or Failed │    └──────┘             (working)     └──────────┘
```

If you deploy a Pod directly with `kubectl run hello --image=nginx`, and the Pod crashes, Kubernetes does NOT automatically create a new Pod. That container is gone. Your service is down.

### The Analogy: Deployment as Manager

A Deployment is a manager that guarantees a desired state:

```
You: "I want 3 workers doing X jobs"Deployment Manager:- Checks: Do we have 3 workers?- No: Creates new worker- Yes: Checks if they're healthy- Unhealthy: Replaces them- Done: Moves to next check
```

The manager runs continuously, observing reality and fixing mismatches. This is Kubernetes' declarative model in action.

* * *

## The Deployment Abstraction: A Hierarchy

Deployments don't directly manage Pods. They use an intermediate abstraction called a **ReplicaSet**.

```
Deployment (what you create)    ↓ managesReplicaSet (intermediate controller)    ↓ managesPods (actual running containers)
```

### Why This Hierarchy?

**Deployment**: High-level abstraction for updates, rollbacks, scaling.

**ReplicaSet**: Low-level abstraction that says "keep N copies of this Pod template running."

**Pods**: Actual containers running your workload.

The hierarchy allows different responsibilities:

-   A Deployment owns ReplicaSets
-   Each ReplicaSet owns multiple Pods
-   When you update a Deployment's image version, it creates a NEW ReplicaSet with new Pods, leaving the old ReplicaSet in place (for rollbacks)

* * *

## Creating Your First Deployment

Let's create a Deployment manifest for a simple nginx service.

### Deployment YAML Structure

```
apiVersion: apps/v1kind: Deploymentmetadata:  name: hello-deployment  labels:    app: hellospec:  replicas: 3  selector:    matchLabels:      app: hello  template:    metadata:      labels:        app: hello    spec:      containers:      - name: hello        image: nginx:1.24        ports:        - containerPort: 80        resources:          limits:            memory: "128Mi"            cpu: "500m"
```

**Output:** (This is just the manifest structure; we'll apply it next)

### Understanding Each Field

**`replicas: 3`** Desired number of Pod copies. Kubernetes ensures this many exist at all times.

**`selector.matchLabels.app: hello`** The Deployment finds its Pods by looking for labels matching `app: hello`. This is how the Deployment knows which Pods belong to it.

**`template`** The Pod template. This is identical to a Pod spec from Lesson 2. Every Pod created by this Deployment uses this template.

**Important**: The labels in `template.metadata.labels` MUST match the selector in `selector.matchLabels`. If they don't match, Kubernetes can't find the Pods, and the Deployment creates an infinite number of new Pods trying to satisfy the replicas requirement.

**`containers`** One or more containers running in each Pod. Here we have a single nginx container on port 80, with memory and CPU limits.

* * *

## Deploying and Verifying

Save the manifest above as `deployment.yaml` and deploy it:

```
kubectl apply -f deployment.yaml
```

**Output:**

```
deployment.apps/hello-deployment created
```

Check the Deployment status:

```
kubectl get deployments
```

**Output:**

```
NAME               READY   UP-TO-DATE   AVAILABLE   AGEhello-deployment   3/3     3            3           30s
```

**What each column means:**

-   **READY**: 3 of 3 desired replicas are ready
-   **UP-TO-DATE**: 3 replicas are running the desired image version
-   **AVAILABLE**: 3 replicas are ready to accept traffic
-   **AGE**: Deployment was created 30 seconds ago

Check the Pods created by this Deployment:

```
kubectl get pods -l app=hello
```

**Output:**

```
NAME                               READY   STATUS    RESTARTS   AGEhello-deployment-7d4b8c9f5-abc12   1/1     Running   0          30shello-deployment-7d4b8c9f5-def34   1/1     Running   0          30shello-deployment-7d4b8c9f5-ghi56   1/1     Running   0          30s
```

Notice the Pod names: `hello-deployment-[ReplicaSet-hash]-[random-id]`. The ReplicaSet is embedded in the name.

Check the ReplicaSet:

```
kubectl get replicasets
```

**Output:**

```
NAME                         DESIRED   CURRENT   READY   AGEhello-deployment-7d4b8c9f5   3         3         3       30s
```

The ReplicaSet `hello-deployment-7d4b8c9f5` is responsible for ensuring 3 Pods exist.

* * *

## Self-Healing in Action

Now demonstrate Kubernetes' self-healing. Intentionally delete one Pod:

```
kubectl delete pod hello-deployment-7d4b8c9f5-abc12
```

**Output:**

```
pod "hello-deployment-7d4b8c9f5-abc12" deleted
```

Wait a few seconds, then check Pods again:

```
kubectl get pods -l app=hello
```

**Output:**

```
NAME                               READY   STATUS    RESTARTS   AGEhello-deployment-7d4b8c9f5-def34   1/1     Running   0          2m45shello-deployment-7d4b8c9f5-ghi56   1/1     Running   0          2m45shello-deployment-7d4b8c9f5-xyzab   1/1     Running   0          5s
```

**What happened:**

1.  You deleted Pod `abc12`
2.  Kubernetes' ReplicaSet controller detected: "I should have 3 Pods, but I only have 2"
3.  It immediately created a new Pod `xyzab` (timestamp: 5 seconds ago)
4.  The Deployment still shows 3/3 ready replicas

This is self-healing: Kubernetes automatically recovers from Pod failures without human intervention.

* * *

## Scaling Deployments

Increase the replica count from 3 to 5:

```
kubectl scale deployment hello-deployment --replicas=5
```

**Output:**

```
deployment.apps/hello-deployment scaled
```

Check the result:

```
kubectl get deployments hello-deployment
```

**Output:**

```
NAME               READY   UP-TO-DATE   AVAILABLE   AGEhello-deployment   5/5     5            5           5m
```

Check Pods:

```
kubectl get pods -l app=hello
```

**Output:**

```
NAME                               READY   STATUS    RESTARTS   AGEhello-deployment-7d4b8c9f5-def34   1/1     Running   0          5m30shello-deployment-7d4b8c9f5-ghi56   1/1     Running   0          5m30shello-deployment-7d4b8c9f5-xyzab   1/1     Running   0          4mhello-deployment-7d4b8c9f5-pqr78   1/1     Running   0          10shello-deployment-7d4b8c9f5-stu90   1/1     Running   0          10s
```

Two new Pods (timestamps: 10 seconds ago) were created to reach 5 replicas.

Scale back down:

```
kubectl scale deployment hello-deployment --replicas=3
```

**Output:**

```
deployment.apps/hello-deployment scaled
```

Kubernetes will terminate 2 Pods gracefully.

* * *

## Rolling Updates: Upgrading Your Application

Your application needs to upgrade from nginx 1.24 to nginx 1.25. Update the image:

```
kubectl set image deployment/hello-deployment hello=nginx:1.25
```

**Output:**

```
deployment.apps/hello-deployment image updated
```

Watch the rollout:

```
kubectl rollout status deployment/hello-deployment
```

**Output:**

```
Waiting for deployment "hello-deployment" rollout to finish: 1 out of 3 new replicas have been updated...Waiting for deployment "hello-deployment" rollout to finish: 2 out of 3 new replicas have been updated...deployment "hello-deployment" successfully rolled out
```

What Kubernetes did:

1.  Created a new ReplicaSet with image nginx:1.25
2.  Started a new Pod with the new image
3.  Once the new Pod was ready, terminated an old Pod
4.  Repeated until all 3 Pods were running nginx 1.25
5.  Left the old ReplicaSet in place (for rollback)

Check the ReplicaSets:

```
kubectl get replicasets
```

**Output:**

```
NAME                         DESIRED   CURRENT   READY   AGEhello-deployment-7d4b8c9f5   0         0         0       10mhello-deployment-8f9c2k3m   3         3         3       2m
```

The old ReplicaSet has 0 desired replicas (no Pods). The new ReplicaSet has 3 Pods running.

* * *

## Rollback: Recovering from Failed Updates

If the update introduced a bug and the new version doesn't work, rollback immediately:

```
kubectl rollout undo deployment/hello-deployment
```

**Output:**

```
deployment.apps/hello-deployment rolled back
```

Kubernetes:

1.  Recreates the old ReplicaSet with nginx 1.24
2.  Scales down the new ReplicaSet
3.  Your Pods are back on the stable version

Check status:

```
kubectl rollout status deployment/hello-deployment
```

**Output:**

```
deployment.apps/hello-deployment successfully rolled back
```

View the history of updates:

```
kubectl rollout history deployment/hello-deployment
```

**Output:**

```
deployment.apps/hello-deploymentREVISION  CHANGE-CAUSE1         <none>2         <none>3         <none>
```

Each revision is a ReplicaSet. You can even rollback to a specific revision:

```
kubectl rollout undo deployment/hello-deployment --to-revision=1
```

* * *

## The Declarative Model at Work

Reflect on what happened:

Action

What You Specified

What Kubernetes Did

Create Deployment

"I want 3 replicas of nginx:1.24"

Created ReplicaSet, created 3 Pods, monitored health

Delete Pod

(pod deleted)

ReplicaSet detected mismatch: 2 instead of 3, created new Pod

Scale to 5

"I want 5 replicas"

ReplicaSet scaled up, created 2 new Pods

Update image

"I want nginx:1.25"

Created new ReplicaSet, performed rolling update, old ReplicaSet available for rollback

Rollback

"Go back"

Reactivated old ReplicaSet, terminated new Pods

You never said HOW. You declared WHAT you wanted, and Kubernetes' controllers continuously worked to achieve that state.

This is the power of Kubernetes: **declare your desired state, and Kubernetes keeps you there.**

* * *

## Key Concepts Summary

**Deployment**: High-level Kubernetes resource that manages ReplicaSets and enables rolling updates, rollbacks, and scaling.

**ReplicaSet**: Controller that ensures a desired number of Pod copies exist. Deployments use ReplicaSets internally.

**Replicas**: The desired number of Pod copies. Kubernetes maintains this count automatically.

**Selector**: Labels used to identify which Pods belong to a Deployment. Must match Pod labels.

**Rolling Update**: Update strategy where old Pods are replaced gradually, ensuring availability during updates.

**Self-Healing**: Automatic recovery when Pods fail. The ReplicaSet controller detects failure and creates replacement Pods.

**Reconciliation Loop**: Kubernetes' control plane continuously compares desired state (replicas: 3) with actual state (2 Pods running), and takes action to close the gap.

* * *

## Try With AI

Open a terminal and work through these scenarios with an AI assistant's help:

### Scenario 1: Design a Deployment

**Your task:** Create a Deployment manifest for a Python Flask application that:

-   Runs 2 replicas
-   Uses image `myregistry.azurecr.io/flask-app:v2.1`
-   Exposes port 5000
-   Requires 256Mi memory and 250m CPU

Ask AI: "Create a Deployment manifest for a Flask app with these requirements: \[list your requirements\]"

Review AI's response:

-   Does the replica count match your requirement (2)?
-   Is the port correct (5000)?
-   Are resource limits set correctly?
-   Are labels and selectors consistent?

Tell AI your constraints: "The image needs to be pulled with a secret called my-registry-secret because it's in a private registry."

Ask AI: "Update the manifest to handle the private registry secret."

**Reflection:**

-   What changed in the manifest?
-   Why is imagePullSecrets needed for private registries?
-   Could you deploy this immediately, or do other prerequisites exist?

### Scenario 2: Troubleshoot a Deployment

**Your task:** You deployed a Deployment, but `kubectl get deployments` shows `0/3 READY`. The manifest looks correct, but Pods aren't running.

Ask AI: "I deployed a Deployment for my app, but the READY status shows 0/3. What could be wrong?"

AI might suggest checking:

-   Pod status with `kubectl describe pod`
-   Container logs with `kubectl logs`
-   Events with `kubectl get events`

Ask: "Show me the exact commands I should run to diagnose this."

**Reflection:**

-   What troubleshooting steps did AI suggest?
-   Which command would tell you if the image pull failed?
-   What would you look for in Pod events to diagnose the issue?

### Scenario 3: Plan a Zero-Downtime Update

**Your task:** You need to update your Deployment from version 1.0 to 2.0, but the service cannot have downtime. You're unsure about the rolling update strategy.

Ask AI: "Explain the rolling update process. I have 3 replicas—walk me through exactly what happens when I update the image."

AI should explain:

1.  New ReplicaSet created
2.  One Pod replaced at a time (default MaxSurge/MaxUnavailable)
3.  Health checks before continuing
4.  Old ReplicaSet retained for rollback

Ask: "What happens if the new version has a bug and Pods crash? How do I recover?"

**Reflection:**

-   Did AI's explanation match the commands you ran earlier?
-   What's the advantage of retaining the old ReplicaSet?
-   How quickly can you rollback if needed?

* * *

## Reflect on Your Skill

You built a `kubernetes-deployment` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my kubernetes-deployment skill, create a Deployment with 3 replicas and rolling update strategy.Does my skill generate a Deployment manifest with proper replica count and update configuration?
```

### Identify Gaps

Ask yourself:

-   Did my skill include the Deployment → ReplicaSet → Pod hierarchy?
-   Did it explain rolling updates and how Kubernetes creates new ReplicaSets for version changes?
-   Did it cover rollback using kubectl rollout undo?
-   Did it explain self-healing (automatic Pod replacement when deleted)?

### Improve Your Skill

If you found gaps:

```
My kubernetes-deployment skill is missing Deployment update and rollback strategies.Update it to include rolling update behavior, ReplicaSet management, kubectl rollout commands, and self-healing mechanisms.
```

* * *

Checking access...

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 50: Kubernetes for AI Services](/docs/AI-Cloud-Native-Development/kubernetes-for-ai-services)
-   Services and Networking: Stable Access to Dynamic Pods

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/50-kubernetes-for-ai-services/05-services-and-networking.md)

# Services and Networking: Stable Access to Dynamic Pods

Your Deployment from Lesson 4 is running Pods. But there's a problem: **Pods are ephemeral. When a Pod crashes and is replaced, it gets a new IP address. Your application clients can't track these constant changes.**

Enter Services. A Service is a stable, virtual IP address that routes to a dynamic set of Pods. It's like a phone number that rings to whoever happens to be on duty today—not tied to one person, but always available.

In this lesson, you'll understand why Services are necessary, learn the three main Service types, and master the mechanism that makes it all work: label selectors.

* * *

## The Networking Problem: Pods Are Ephemeral

In Docker (Chapter 49), a container had a stable network identity. You'd run a container, learn its IP, and talk to it.

Kubernetes is different. Pods are designed to be replaced:

```
apiVersion: v1kind: Podmetadata:  name: example-podspec:  containers:  - name: nginx    image: nginx:alpine
```

When this Pod crashes and Kubernetes restarts it, a new Pod takes its place. But the new Pod gets a **new IP address**. The old IP becomes invalid.

### The Direct IP Problem

Imagine your frontend application tries to talk to your backend:

```
# In a frontend Podresponse = requests.get("http://10.0.2.45:5000/data")
```

If the backend Pod gets replaced (it will), `10.0.2.45` no longer exists. The request fails.

**This is unacceptable in production.** You need a stable address that routes to the current set of healthy backend Pods, regardless of which specific Pods are running.

**Enter Services.**

* * *

## Services: Stable Virtual IP Addresses

A **Service** is a Kubernetes abstraction that provides:

1.  **A stable virtual IP address** (ClusterIP) that doesn't change
2.  **Load balancing** across Pods matching the Service's label selector
3.  **Service discovery** through Kubernetes DNS

Think of a Service like a phone number. The number stays the same, but the person who answers might change. Call the same number and get connected to whoever is currently on duty.

### How Services Work

A Service uses **label selectors** to determine which Pods receive traffic. Here's the mechanism:

```
apiVersion: v1kind: Servicemetadata:  name: backend-servicespec:  selector:    app: backend        # <-- Label selector: "find Pods with label app=backend"  ports:  - port: 80           # <-- Service listens on port 80    targetPort: 5000   # <-- Forward to port 5000 in the Pod  type: ClusterIP      # <-- Service type (discussed below)
```

When you apply this Service:

1.  Kubernetes creates a virtual IP address (e.g., `10.96.0.1`)
2.  It identifies all Pods matching `app: backend`
3.  It load-balances traffic to those Pods' port 5000
4.  If Pods are added/removed, the Service updates automatically

Your frontend Pod now talks to:

```
response = requests.get("http://backend-service:80/data")
```

Even when backend Pods crash and restart, the Service name and IP stay constant. Kubernetes automatically updates the endpoints.

* * *

## The Three Service Types

Kubernetes offers three main Service types. Choose based on your access pattern.

### 1\. ClusterIP: Internal Communication (Default)

**Use when**: Pods need to talk to other Pods within the cluster.

```
apiVersion: v1kind: Servicemetadata:  name: database-servicespec:  selector:    app: database  ports:  - port: 5432    targetPort: 5432  type: ClusterIP    # Default if omitted
```

**Characteristics**:

-   Virtual IP only accessible from within the cluster
-   No external access possible
-   Lightweight and efficient
-   Most common type (used internally between Pods)

**Example traffic flow**:

```
Frontend Pod → (requests) → ClusterIP Service (10.96.0.5:5432)  → (routes to) → Database Pod
```

### 2\. NodePort: External Access via Host Port

**Use when**: You need external clients to access your application (development/testing).

```
apiVersion: v1kind: Servicemetadata:  name: api-servicespec:  selector:    app: api  ports:  - port: 80              # Service port (internal)    targetPort: 8000      # Pod port    nodePort: 30007       # Host port (must be 30000-32767)  type: NodePort
```

**Characteristics**:

-   Allocates a port on every cluster node (30000-32767 range)
-   External clients access `<node-ip>:<nodePort>`
-   Useful for development and testing
-   Not recommended for production (traffic through nodes)

**Example traffic flow**:

```
External Client → (connects to) → Node IP:30007  → (routes to) → Service (10.96.0.1:80)  → (load balances to) → API Pods
```

### 3\. LoadBalancer: Production External Access

**Use when**: You need production-grade external access with load balancing.

```
apiVersion: v1kind: Servicemetadata:  name: frontend-servicespec:  selector:    app: frontend  ports:  - port: 80    targetPort: 3000  type: LoadBalancer
```

**Characteristics**:

-   Provisions a cloud load balancer (AWS ELB, Azure LB, GCP LB)
-   Gives your Service a public IP address
-   Load balancer distributes traffic across cluster nodes
-   Recommended for production (handles high traffic, automatic scaling)

**Example traffic flow**:

```
External Client → (connects to) → Cloud LB Public IP:80  → (routes to) → Service (10.96.0.2:80)  → (load balances to) → Frontend Pods
```

### Decision Framework: Choosing Service Type

Requirement

Type

Why

Pod-to-Pod communication

ClusterIP

No external access needed, most efficient

Manual external testing

NodePort

Quick, no cloud LB needed

Production external access

LoadBalancer

Cloud LB handles scalability, reliability

Multi-environment consistency

ClusterIP + Ingress

(Ingress covered in later chapter)

* * *

## Understanding Label Selectors

Label selectors are **the mechanism that connects Services to Pods**. They're critical to understand because misconfigured selectors cause Services to have zero endpoints.

### How Label Selectors Work

When you define a Service selector, Kubernetes continuously asks: "Which Pods match these labels?"

```
# Service definitionapiVersion: v1kind: Servicemetadata:  name: web-servicespec:  selector:    app: web           # <-- Kubernetes finds Pods with app: web    version: v1        # <-- AND version: v1  ports:  - port: 80    targetPort: 8080
```

This Service routes traffic to Pods labeled **both** `app: web` **and** `version: v1`.

### Example: Label Matching

**Pod 1: Matches the selector**

```
apiVersion: v1kind: Podmetadata:  name: web-pod-1  labels:    app: web        # <-- Matches    version: v1     # <-- Matches    env: prod       # <-- Extra label (OK)spec:  containers:  - name: nginx    image: nginx:alpine
```

**Pod 2: Does NOT match**

```
apiVersion: v1kind: Podmetadata:  name: api-pod-1  labels:    app: api        # <-- Does NOT match (wrong value)    version: v1     # <-- Matches but doesn't satisfy bothspec:  containers:  - name: flask    image: flask:latest
```

**Pod 3: Does NOT match**

```
apiVersion: v1kind: Podmetadata:  name: web-pod-2  labels:    app: web        # <-- Matches    version: v2     # <-- Does NOT match (wrong version)spec:  containers:  - name: nginx    image: nginx:alpine
```

The Service routes to **Pod 1 only**. Pods 2 and 3 are ignored.

* * *

## Hands-On: Creating and Exposing Services

You'll create a Deployment, then expose it via different Service types. Start with your Docker Desktop Kubernetes cluster running.

### Step 1: Create a Deployment with Clear Labels

Create a file called `web-deployment.yaml`:

```
apiVersion: apps/v1kind: Deploymentmetadata:  name: web-deploymentspec:  replicas: 3  selector:    matchLabels:      app: web          # <-- Key label  template:    metadata:      labels:        app: web        # <-- Pod gets this label    spec:      containers:      - name: nginx        image: nginx:alpine        ports:        - containerPort: 80
```

Apply it:

```
kubectl apply -f web-deployment.yaml
```

**Output:**

```
deployment.apps/web-deployment created
```

Verify Pods are running with labels displayed:

```
kubectl get pods --show-labels
```

**Output:**

```
NAME                              READY   STATUS    RESTARTS   AGE   LABELSweb-deployment-5d5f4c7f5b-abc12   1/1     Running   0          10s   app=web,pod-template-hash=5d5f4c7f5bweb-deployment-5d5f4c7f5b-def45   1/1     Running   0          10s   app=web,pod-template-hash=5d5f4c7f5bweb-deployment-5d5f4c7f5b-ghi78   1/1     Running   0          10s   app=web,pod-template-hash=5d5f4c7f5b
```

Notice each Pod has the label `app=web` (the key label the Service will use). Get their IP addresses:

```
kubectl get pods -o wide
```

**Output:**

```
NAME                              READY   STATUS    RESTARTS   AGE   IP           NODEweb-deployment-5d5f4c7f5b-abc12   1/1     Running   0          10s   10.244.0.3   docker-desktopweb-deployment-5d5f4c7f5b-def45   1/1     Running   0          10s   10.244.0.4   docker-desktopweb-deployment-5d5f4c7f5b-ghi78   1/1     Running   0          10s   10.244.0.5   docker-desktop
```

Each Pod has a unique IP: `10.244.0.3`, `10.244.0.4`, `10.244.0.5`. If a Pod crashes, Kubernetes replaces it with a new Pod at a new IP. This is why Services matter—they provide stable routing regardless of which Pod IPs are currently active.

### Step 2: Expose via ClusterIP Service

Create `web-service-clusterip.yaml`:

```
apiVersion: v1kind: Servicemetadata:  name: web-servicespec:  selector:    app: web          # <-- Targets Pods with app: web  ports:  - port: 80    targetPort: 80  type: ClusterIP
```

Apply it:

```
kubectl apply -f web-service-clusterip.yaml
```

**Output:**

```
service/web-service created
```

Inspect the Service:

```
kubectl get services
```

**Output:**

```
NAME          TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)web-service   ClusterIP   10.96.0.234     <none>        80/TCP
```

The Service has a stable virtual IP: `10.96.0.234`. This IP never changes, even if Pods are replaced.

### Step 3: Access the Service Internally

Launch a temporary Pod inside the cluster to test internal access:

```
kubectl run -it test-pod --image=alpine --rm -- sh
```

From inside the Pod, curl the Service:

```
apk add curlcurl http://web-service
```

**Output:**

```
<!DOCTYPE html><html><head>    <title>Welcome to nginx!</title></head>...
```

Success! The Service routed your request to one of the backend Pods. Try it again:

```
curl http://web-service
```

Same output. Kubernetes load-balanced across Pods transparently. You didn't need to know which specific Pod answered—the Service handled it.

Exit the test Pod:

```
exit
```

### Step 4: Convert to NodePort for External Access

Update `web-service-clusterip.yaml`:

```
apiVersion: v1kind: Servicemetadata:  name: web-servicespec:  selector:    app: web  ports:  - port: 80    targetPort: 80    nodePort: 30007      # <-- Add this (external port)  type: NodePort         # <-- Change this
```

Apply the update:

```
kubectl apply -f web-service-clusterip.yaml
```

**Output:**

```
service/web-service configured
```

Verify the change:

```
kubectl get services
```

**Output:**

```
NAME          TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)web-service   NodePort   10.96.0.234     <none>        80:30007/TCP
```

The Service now listens on node port 30007. With Docker Desktop, access the Service via localhost:

```
curl http://localhost:30007
```

**Output:**

```
<!DOCTYPE html><html><head>    <title>Welcome to nginx!</title></head>...
```

Success! External traffic now reaches your Deployment through the NodePort Service.

* * *

## Kubernetes DNS: Service Discovery

Your Pods don't need to know the Service IP address. Kubernetes provides **automatic DNS discovery**.

Every Service gets a DNS name in the format:

```
<service-name>.<namespace>.svc.cluster.local
```

For the `web-service` in the `default` namespace:

```
web-service.default.svc.cluster.local
```

Within the same namespace, you can shorten it to:

```
web-service
```

### DNS in Action

Launch a test Pod and resolve the DNS name:

```
kubectl run -it test-pod --image=alpine --rm -- sh
```

From inside the Pod, install curl and bind-tools (for DNS utilities), then test DNS resolution:

```
apk add curl bind-toolsnslookup web-service
```

**Output:**

```
Name:      web-serviceAddress 1: 10.96.0.234
```

Kubernetes DNS returned the Service's virtual IP. Your application can connect without hardcoding IPs. Test it:

```
curl -I http://web-service
```

**Output:**

```
HTTP/1.1 200 OKServer: nginx/1.26.2Date: Fri, 22 Dec 2023 10:15:32 GMTContent-Type: text/htmlContent-Length: 612Connection: keep-alive
```

The request succeeded! Kubernetes DNS resolved `web-service` to the virtual IP, and the Service routed to a backend Pod.

You can also use the full DNS name from different namespaces:

```
curl -I http://web-service.default.svc.cluster.local
```

**Output:**

```
HTTP/1.1 200 OKServer: nginx/1.26.2Date: Fri, 22 Dec 2023 10:15:35 GMTContent-Type: text/htmlContent-Length: 612Connection: keep-alive
```

Both work. Kubernetes DNS resolves either form to the virtual IP. Exit the test Pod:

```
exit
```

* * *

## Debugging: Service Selector Mismatch

The most common Service problem: **a Service has no endpoints**. This happens when the label selector doesn't match any Pods.

### Scenario: Misconfigured Selector

Create a Deployment with `app: backend`:

```
apiVersion: apps/v1kind: Deploymentmetadata:  name: backend-deploymentspec:  replicas: 2  selector:    matchLabels:      app: backend  template:    metadata:      labels:        app: backend    spec:      containers:      - name: flask        image: flask:latest        ports:        - containerPort: 5000
```

Apply it:

```
kubectl apply -f backend-deployment.yaml
```

**Output:**

```
deployment.apps/backend-deployment created
```

Now create a Service with the **wrong** selector:

```
apiVersion: v1kind: Servicemetadata:  name: backend-servicespec:  selector:    app: api          # <-- WRONG: Looking for app: api, but Pods have app: backend  ports:  - port: 80    targetPort: 5000  type: ClusterIP
```

Apply it:

```
kubectl apply -f backend-service-wrong.yaml
```

**Output:**

```
service/backend-service created
```

Check the Service endpoints:

```
kubectl get endpoints backend-service
```

**Output:**

```
NAME               ENDPOINTS   AGEbackend-service    <none>      10s
```

**No endpoints!** The Service exists but routes to nothing. Any traffic sent to this Service fails because there's no Pod to handle it.

### Fixing the Selector

Update the Service with the correct selector:

```
apiVersion: v1kind: Servicemetadata:  name: backend-servicespec:  selector:    app: backend      # <-- FIXED: Now matches the Pod labels  ports:  - port: 80    targetPort: 5000  type: ClusterIP
```

Apply the fix:

```
kubectl apply -f backend-service-wrong.yaml
```

**Output:**

```
service/backend-service configured
```

Check endpoints again:

```
kubectl get endpoints backend-service
```

**Output:**

```
NAME               ENDPOINTS                              AGEbackend-service    10.244.0.6:5000,10.244.0.7:5000       5s
```

Now the Service has 2 endpoints (the 2 backend Pods). Traffic will route correctly.

### Debugging Process

When a Service has no endpoints, follow this systematic check:

1.  **List the Pods and their labels**:

```
kubectl get pods --show-labels
```

**Output:**

```
NAME                              READY   LABELSbackend-deployment-abcd1234-xyz   1/1     app=backend,pod-template-hash=abcd1234backend-deployment-abcd1234-uvw   1/1     app=backend,pod-template-hash=abcd1234
```

2.  **Check the Service selector**:

```
kubectl describe service backend-service
```

**Output:**

```
Name:              backend-serviceNamespace:         defaultLabels:            <none>Annotations:       <none>Selector:          app: api              # <-- Wrong! Should be app: backendType:              ClusterIPIP:                10.96.0.1Port:              <unset>  80/TCPTargetPort:        5000/TCPEndpoints:         <none>Session Affinity:  None
```

3.  **Compare**: The Pods have `app=backend` but the Service selector is `app=api`. That's the mismatch. Fix the Service selector to match the Pod labels.
    
4.  **Verify the fix**:
    

```
kubectl describe service backend-service
```

**Output:**

```
Name:              backend-serviceNamespace:         defaultSelector:          app: backend          # <-- Fixed!Type:              ClusterIPIP:                10.96.0.1Port:              <unset>  80/TCPTargetPort:        5000/TCPEndpoints:         10.244.0.6:5000,10.244.0.7:5000   # <-- Endpoints now populated!Session Affinity:  None
```

Now the Service has endpoints. Traffic will route correctly to the backend Pods.

* * *

## Service Networking Summary

Concept

Purpose

Example

**Service**

Stable virtual IP routing to dynamic Pods

`web-service` (IP: 10.96.0.234)

**Label Selector**

Mechanism to match Pods

`app: web`, `version: v1`

**ClusterIP**

Internal Pod-to-Pod communication

Backend database accessed by frontend

**NodePort**

External access via host port

Testing tool accessing API on port 30007

**LoadBalancer**

Production external access via cloud LB

Public users accessing frontend

**DNS**

Service discovery by name

`web-service.default.svc.cluster.local`

* * *

## Try With AI

**Challenge**: You have a FastAPI agent running in Kubernetes (from Chapter 49 containerization). Expose it so:

-   Other Pods in the cluster can call its API
-   External clients can access it for testing

You'll describe the requirements, and you and AI will iterate on the Service configuration.

**Setup**:

-   Your agent Deployment is named `agent-deployment` with label `app: agent`
-   It listens on port 8000
-   You'll deploy to your Docker Desktop Kubernetes cluster

**Part 1: Internal Access Requirement**

Tell AI: "I need a Service that lets other Pods access my agent at port 8000. The agent Deployment has label `app: agent`."

Record AI's Service specification for internal access.

**Part 2: Evaluate Internal Design**

Review AI's response:

-   Does the Service selector match the Deployment labels?
-   Is the port mapping correct (80 → 8000)?
-   Is the type appropriate for internal access?

Ask yourself: What would you change to make this better?

**Part 3: External Access Requirement**

Tell AI: "Now I also need external clients to test the agent. Should I convert to NodePort or LoadBalancer? I'm testing locally with Docker Desktop Kubernetes."

Note AI's reasoning about the choice.

**Part 4: Design Validation**

Ask AI: "Show me the complete Service YAML for external testing access on Docker Desktop Kubernetes."

Apply the YAML to your cluster:

```
kubectl apply -f agent-service.yaml
```

Test external access:

```
curl http://localhost:<nodeport>/docs  # Your FastAPI agent's Swagger docs
```

**Part 5: Reflection**

Compare your initial understanding to what emerged:

-   Did you initially consider both internal and external access?
-   What would you do differently when deploying to a cloud cluster instead of Docker Desktop?
-   When would you choose LoadBalancer over NodePort?

These questions activate your reasoning for future Service design decisions in production environments.

* * *

## Reflect on Your Skill

You built a `kubernetes-deployment` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my kubernetes-deployment skill, create a Service that exposes a Deployment.Does my skill generate ClusterIP, NodePort, or LoadBalancer Service types with proper label selectors?
```

### Identify Gaps

Ask yourself:

-   Did my skill include the three Service types (ClusterIP, NodePort, LoadBalancer) and when to use each?
-   Did it explain label selectors as the mechanism connecting Services to Pods?
-   Did it cover Kubernetes DNS (service.namespace.svc.cluster.local)?
-   Did it include debugging steps for Services with no endpoints?

### Improve Your Skill

If you found gaps:

```
My kubernetes-deployment skill is missing Service networking patterns and DNS discovery.Update it to include Service type selection, label selector configuration, DNS naming conventions, and endpoint troubleshooting.
```

* * *

Checking access...

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 50: Kubernetes for AI Services](/docs/AI-Cloud-Native-Development/kubernetes-for-ai-services)
-   Namespaces: Virtual Clusters for AI Workloads

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/50-kubernetes-for-ai-services/06-namespaces-virtual-clusters.md)

# Namespaces: Virtual Clusters for AI Workloads

You've deployed services to Kubernetes and exposed them for traffic. But what happens when your dev team's experimental agent consumes all the cluster's GPU memory? Or when a prod bug causes one team's deployment to spiral out of control, bringing down everyone else's workloads? In shared clusters, resource contention becomes inevitable without boundaries.

Namespaces solve this. They're virtual clusters within a single Kubernetes cluster—isolated spaces where you can enforce quotas, set default limits, and partition workloads by environment, team, or project. When you deploy the same agent to dev, staging, and production, namespaces keep each environment separate and constrained.

## What Are Namespaces?

A namespace is a logical partition of a Kubernetes cluster. Think of it like having separate apartments in a building—they share the same foundation and utilities, but each has its own door, locks, and boundaries.

**Three key properties of namespaces:**

1.  **Resource Scoping**: Pods, services, and deployments live in namespaces. When you reference a service, you implicitly reference the one in the current namespace (unless you specify otherwise)
2.  **Quota Enforcement**: You can limit CPU, memory, and storage per namespace so one team's workloads can't starve others
3.  **Identity Isolation**: Service accounts and RBAC policies are namespaced, enabling per-environment security

**Kubernetes provides three built-in namespaces:**

-   `default` - Where your resources go if you don't specify a namespace
-   `kube-system` - Core Kubernetes components (API server, controller manager, DNS)
-   `kube-public` - Publicly readable resources (cluster info ConfigMaps)

The problem without namespaces: All deployments share one resource pool. A runaway pod in development can consume cluster memory, causing prod services to crash. The solution: Use namespaces to partition the cluster by environment and enforce quotas.

## Creating and Managing Namespaces

Let's create namespaces for dev, staging, and production environments. The simplest approach is using kubectl:

```
kubectl create namespace devkubectl create namespace stagingkubectl create namespace prod
```

**Output:**

```
namespace/dev creatednamespace/staging creatednamespace/prod created
```

Verify the namespaces exist:

```
kubectl get namespaces
```

**Output:**

```
NAME              STATUS   AGEdefault           Active   2d15hdev               Active   45skube-node-lease   Active   2d15hkube-public       Active   2d15hkube-system       Active   2d15hprod              Active   42sstaging           Active   43s
```

Now let's deploy a simple agent deployment to the dev namespace:

```
kubectl apply -f - <<EOFapiVersion: apps/v1kind: Deploymentmetadata:  name: agent-api  namespace: devspec:  replicas: 2  selector:    matchLabels:      app: agent-api      env: dev  template:    metadata:      labels:        app: agent-api        env: dev    spec:      containers:      - name: api        image: agent-api:latest        ports:        - containerPort: 8000        resources:          requests:            cpu: 100m            memory: 128Mi          limits:            cpu: 500m            memory: 512MiEOF
```

**Output:**

```
deployment.apps/agent-api created
```

Verify the deployment exists in the dev namespace:

```
kubectl get deployments --namespace=dev
```

**Output:**

```
NAME        READY   UP-TO-DATE   AVAILABLE   AGEagent-api   2/2     2            2           15s
```

Notice the `--namespace=dev` flag. Without it, kubectl defaults to the `default` namespace. You can also use the shorthand `-n dev`.

## ResourceQuotas: Limiting Namespace Resource Usage

Namespaces become powerful when you enforce quotas. A ResourceQuota limits the total CPU, memory, and other resources a namespace can consume. This prevents one team's workloads from starving others.

Create a ResourceQuota for the dev namespace:

```
kubectl apply -f - <<EOFapiVersion: v1kind: ResourceQuotametadata:  name: dev-quota  namespace: devspec:  hard:    requests.cpu: "2"           # Max 2 CPUs across all pods    requests.memory: "2Gi"      # Max 2GB RAM across all pods    limits.cpu: "4"             # Max 4 CPUs in limits across all pods    limits.memory: "4Gi"        # Max 4GB in limits across all pods    pods: "20"                  # Max 20 pods in this namespace    requests.storage: "10Gi"    # Max 10GB storageEOF
```

**Output:**

```
resourcequota/dev-quota created
```

Verify the quota was created:

```
kubectl get resourcequota --namespace=dev
```

**Output:**

```
NAME        AGE   REQUEST.CPU   REQUEST.MEMORY   LIMITS.CPU   LIMITS.MEMORY   PODSdev-quota   8s    200m          256Mi            1            1Gi             2/20
```

The output shows current usage (200m CPU, 256Mi memory) from the two agent-api pods we created earlier. The quota allows up to 2 CPUs and 2GB memory in requests.

**Why this matters for AI workloads:** GPU-intensive agents require reserved resources. A ResourceQuota prevents experimental agents in dev from consuming the GPU memory that staging needs for final testing.

## LimitRanges: Default Limits for Containers

ResourceQuotas set namespace-wide limits. LimitRanges set per-container defaults and boundaries. When developers deploy containers without specifying requests/limits, LimitRange provides sensible defaults.

Create a LimitRange for the dev namespace:

```
kubectl apply -f - <<EOFapiVersion: v1kind: LimitRangemetadata:  name: dev-limits  namespace: devspec:  limits:  - type: Container    default:      cpu: 250m      memory: 256Mi    defaultRequest:      cpu: 100m      memory: 128Mi    max:      cpu: 500m      memory: 512Mi    min:      cpu: 10m      memory: 32MiEOF
```

**Output:**

```
limitrange/dev-limits created
```

Verify the LimitRange:

```
kubectl get limitrange --namespace=dev
```

**Output:**

```
NAME        CREATED ATdev-limits  2025-01-20T14:32:15Z
```

Describe the LimitRange to see the full configuration:

```
kubectl describe limitrange dev-limits --namespace=dev
```

**Output:**

```
Name:       dev-limitsNamespace:  devType        Resource  Min    Max    Default Request  Default Limit----        --------  ---    ---    ---------------  -------------Container   cpu       10m    500m   100m             250mContainer   memory    32Mi   512Mi  128Mi            256Mi
```

Now, if a developer deploys a pod without specifying requests/limits, Kubernetes automatically applies the `defaultRequest` and `default` values from the LimitRange. This ensures every pod in the namespace has reasonable resource boundaries.

**Example**: Deploy a pod without explicit limits—the LimitRange provides defaults:

```
kubectl apply -f - <<EOFapiVersion: v1kind: Podmetadata:  name: agent-worker  namespace: devspec:  containers:  - name: worker    image: agent-worker:latest    ports:    - containerPort: 8001EOF
```

**Output:**

```
pod/agent-worker created
```

Check the pod's actual requests/limits:

```
kubectl get pod agent-worker --namespace=dev -o jsonpath='{.spec.containers[0].resources}'
```

**Output:**

```
{"limits":{"cpu":"250m","memory":"256Mi"},"requests":{"cpu":"100m","memory":"128Mi"}}
```

The LimitRange automatically injected the default values even though we didn't specify them in the pod definition.

## Multi-Environment Strategy: Deploying to Dev, Staging, Prod

The real power of namespaces emerges when you deploy the same application across environments with identical configuration but different resource quotas. Here's how to structure a multi-environment setup:

**1\. Create staging and prod namespaces with their own quotas:**

```
# Staging: More resources than dev, production-like constraintskubectl apply -f - <<EOFapiVersion: v1kind: ResourceQuotametadata:  name: staging-quota  namespace: stagingspec:  hard:    requests.cpu: "4"    requests.memory: "4Gi"    limits.cpu: "8"    limits.memory: "8Gi"    pods: "30"---apiVersion: v1kind: LimitRangemetadata:  name: staging-limits  namespace: stagingspec:  limits:  - type: Container    default:      cpu: 500m      memory: 512Mi    defaultRequest:      cpu: 250m      memory: 256Mi    max:      cpu: 1000m      memory: 1Gi    min:      cpu: 50m      memory: 64MiEOF
```

**Output:**

```
resourcequota/staging-quota createdlimitrange/staging-limits created
```

**2\. Production: Highest quotas and strictest limits:**

```
kubectl apply -f - <<EOFapiVersion: v1kind: ResourceQuotametadata:  name: prod-quota  namespace: prodspec:  hard:    requests.cpu: "8"    requests.memory: "8Gi"    limits.cpu: "16"    limits.memory: "16Gi"    pods: "50"---apiVersion: v1kind: LimitRangemetadata:  name: prod-limits  namespace: prodspec:  limits:  - type: Container    default:      cpu: 750m      memory: 768Mi    defaultRequest:      cpu: 500m      memory: 512Mi    max:      cpu: 2000m      memory: 2Gi    min:      cpu: 100m      memory: 128MiEOF
```

**Output:**

```
resourcequota/prod-quota createdlimitrange/prod-limits created
```

**3\. Deploy your agent to all three environments:**

Save this as `agent-deployment.yaml`:

```
apiVersion: apps/v1kind: Deploymentmetadata:  name: agent-apispec:  replicas: 2  selector:    matchLabels:      app: agent-api  template:    metadata:      labels:        app: agent-api    spec:      containers:      - name: api        image: agent-api:latest        ports:        - containerPort: 8000        resources:          requests:            cpu: 200m            memory: 256Mi          limits:            cpu: 500m            memory: 512Mi
```

Deploy to all three namespaces:

```
kubectl apply -f agent-deployment.yaml --namespace=devkubectl apply -f agent-deployment.yaml --namespace=stagingkubectl apply -f agent-deployment.yaml --namespace=prod
```

**Output:**

```
deployment.apps/agent-api createddeployment.apps/agent-api createddeployment.apps/agent-api created
```

Verify deployments in each namespace:

```
kubectl get deployments --all-namespaces | grep agent-api
```

**Output:**

```
dev            agent-api   2/2     2            2           3m20sprod           agent-api   2/2     2            2           3m15sstaging        agent-api   2/2     2            2           3m18s
```

Now each environment has the same agent running with resource isolation. A memory leak in dev won't affect prod.

## Cross-Namespace Communication

By default, services in one namespace cannot directly reference services in another namespace. But if you need cross-namespace communication, use the fully qualified DNS name: `<service-name>.<namespace-name>.svc.cluster.local`

For example, if the `logging` service in the `observability` namespace needs to reach the `agent-api` service in `prod`:

```
curl http://agent-api.prod.svc.cluster.local:8000/health
```

The DNS name breaks down as:

-   `agent-api` - service name
-   `prod` - namespace
-   `svc.cluster.local` - cluster DNS suffix (always this)

This pattern is useful when you have shared services (logging, monitoring, authentication) in a central namespace that other namespaces need to access.

## Try With AI

You now understand how namespaces provide virtual cluster partitions with resource quotas and per-container limits. The AI collaboration begins when you need to design namespace strategies for complex multi-team scenarios.

### Exercise 1: Design Namespace Strategy for Multi-Team Setup

**Scenario**: Your organization has 3 teams deploying AI agents to the same cluster:

-   **Data Pipeline Team**: Runs long-running training jobs (GPU-intensive, high memory)
-   **Model Serving Team**: Runs inference APIs (low latency requirements, moderate CPU)
-   **Experimentation Team**: Runs short-lived development agents (highly variable, experimental)

**Your task**: Design a namespace strategy that isolates these teams while allowing shared observability services (Prometheus, Loki) to monitor all of them.

**Parts to consider:**

1.  How many namespaces would you create?
2.  What ResourceQuota would you set for each team's namespace?
3.  How would you expose monitoring/logging endpoints so all teams can reach shared services?
4.  What LimitRange defaults would prevent runaway pods in each environment?

**Ask AI to evaluate your strategy**: Describe your namespace design, ResourceQuotas, and cross-namespace access patterns. AI can review whether your quotas are realistic for the workload types and suggest adjustments based on team requirements.

* * *

## Reflect on Your Skill

You built a `kubernetes-deployment` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my kubernetes-deployment skill, create Namespaces with ResourceQuotas and LimitRanges.Does my skill generate namespace isolation with resource limits and default container constraints?
```

### Identify Gaps

Ask yourself:

-   Did my skill include ResourceQuota configuration for limiting namespace resource consumption?
-   Did it explain LimitRanges for setting default container requests and limits?
-   Did it cover cross-namespace communication using fully qualified DNS names?
-   Did it include multi-environment strategies (dev, staging, prod namespaces)?

### Improve Your Skill

If you found gaps:

```
My kubernetes-deployment skill is missing namespace resource management and isolation patterns.Update it to include ResourceQuota and LimitRange configuration, cross-namespace DNS, and multi-environment namespace strategies.
```

* * *

Checking access...

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 50: Kubernetes for AI Services](/docs/AI-Cloud-Native-Development/kubernetes-for-ai-services)
-   ConfigMaps and Secrets

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/50-kubernetes-for-ai-services/07-configmaps-and-secrets.md)

# ConfigMaps and Secrets

In Lesson 4, you built a Deployment that ran a specific container image with a specific environment. What happens when your API key expires and you need to update it? Or when you move from development to production and need different database URLs? Rebuilding your entire container image just to change a configuration value is wasteful and error-prone.

ConfigMaps and Secrets solve this by decoupling configuration from your container image. You store configuration in Kubernetes objects, inject them into your Pods, and change configuration without rebuilding anything. ConfigMaps handle non-sensitive data (URLs, feature flags). Secrets handle sensitive data (API keys, database credentials). Both use the same injection patterns—the difference is in how they're stored and accessed.

* * *

## The Problem: Configuration Baked Into Images

Imagine your AI agent needs an API key to call an external service. Your Dockerfile hardcodes it:

```
FROM python:3.11WORKDIR /appCOPY . .RUN pip install -r requirements.txt# Hardcoding config—terrible practiceENV API_KEY="sk-prod-12345"CMD ["python", "agent.py"]
```

Problems with this approach:

1.  **Same image for all environments**: Production, staging, and development all use the same image with the same API key. Security risk.
2.  **Rebuilding for changes**: Update an API key? Rebuild the entire image.
3.  **Secrets in registries**: Your API key is stored in the container image registry—visible to anyone with access.
4.  **No separation of concerns**: The developer who builds the image shouldn't know production credentials.

Kubernetes ConfigMaps and Secrets invert this model: the image contains no configuration. Kubernetes injects configuration at runtime.

* * *

## ConfigMaps: Non-Sensitive Configuration

A ConfigMap is a Kubernetes object that stores key-value pairs or file content. It's not encrypted—use it for non-sensitive configuration like URLs, feature flags, and log levels.

### Creating a ConfigMap with kubectl

The fastest way to create a ConfigMap is with the kubectl command:

```
kubectl create configmap app-config \  --from-literal=LOG_LEVEL=DEBUG \  --from-literal=DATABASE_URL=postgresql://localhost:5432/mydb \  --from-literal=FEATURE_FLAGS={"analytics":true,"beta":false}
```

**Output:**

```
configmap/app-config created
```

This creates a ConfigMap named `app-config` with three key-value pairs. Let's examine it:

```
kubectl get configmap app-config -o yaml
```

**Output:**

```
apiVersion: v1kind: ConfigMapmetadata:  name: app-config  namespace: defaultspec: {}data:  LOG_LEVEL: "DEBUG"  DATABASE_URL: "postgresql://localhost:5432/mydb"  FEATURE_FLAGS: '{"analytics":true,"beta":false}'
```

Notice: ConfigMaps are plain text. No encryption. They're for non-sensitive data only.

### Creating a ConfigMap with YAML Manifest

For reproducibility, define ConfigMaps in YAML:

```
apiVersion: v1kind: ConfigMapmetadata:  name: app-config  namespace: defaultdata:  LOG_LEVEL: "DEBUG"  DATABASE_URL: "postgresql://localhost:5432/mydb"  FEATURE_FLAGS: '{"analytics":true,"beta":false}'
```

Apply it:

```
kubectl apply -f configmap.yaml
```

**Output:**

```
configmap/app-config created
```

The YAML approach is preferred in production because it's version-controlled and reproducible.

* * *

## Secrets: Sensitive Data

Secrets work like ConfigMaps but are designed for sensitive data: API keys, database passwords, tokens. The key difference: Kubernetes stores Secrets separately from regular data, and some storage backends can encrypt them (though by default, Kubernetes base64-encodes Secrets, which is NOT encryption—see the security note below).

### Creating a Secret with kubectl

```
kubectl create secret generic db-credentials \  --from-literal=username=admin \  --from-literal=password=super-secret-password
```

**Output:**

```
secret/db-credentials created
```

Let's examine it:

```
kubectl get secret db-credentials -o yaml
```

**Output:**

```
apiVersion: v1kind: Secretmetadata:  name: db-credentials  namespace: defaulttype: Opaquedata:  password: c3VwZXItc2VjcmV0LXBhc3N3b3Jk  username: YWRtaW4=
```

Notice the `data` field contains base64-encoded values. Let's decode one:

```
echo "c3VwZXItc2VjcmV0LXBhc3N3b3Jk" | base64 --decode
```

**Output:**

```
super-secret-password
```

### Creating a Secret with YAML Manifest

For production, define Secrets in YAML with base64-encoded values:

```
apiVersion: v1kind: Secretmetadata:  name: db-credentials  namespace: defaulttype: Opaquedata:  username: YWRtaW4=  # base64 of "admin"  password: c3VwZXItc2VjcmV0LXBhc3N3b3Jk  # base64 of "super-secret-password"
```

Or let Kubernetes do the encoding:

```
apiVersion: v1kind: Secretmetadata:  name: db-credentials  namespace: defaulttype: OpaquestringData:  username: admin  password: super-secret-password
```

When using `stringData`, Kubernetes automatically base64-encodes the values when storing them. Apply it:

```
kubectl apply -f secret.yaml
```

**Output:**

```
secret/db-credentials created
```

* * *

## Injecting Configuration as Environment Variables

Once you have a ConfigMap or Secret, inject it into a Pod as environment variables.

### Environment Variable Injection from ConfigMap

Create a Deployment that injects the `app-config` ConfigMap:

```
apiVersion: apps/v1kind: Deploymentmetadata:  name: api-serverspec:  replicas: 2  selector:    matchLabels:      app: api-server  template:    metadata:      labels:        app: api-server    spec:      containers:      - name: api        image: myregistry/agent:v1.0        envFrom:        - configMapRef:            name: app-config        # Individual environment variables from Secrets        env:        - name: DB_PASSWORD          valueFrom:            secretKeyRef:              name: db-credentials              key: password
```

Let's break this down:

-   **`envFrom.configMapRef`**: Injects ALL keys from the `app-config` ConfigMap as environment variables. The Pod sees `LOG_LEVEL`, `DATABASE_URL`, and `FEATURE_FLAGS`.
-   **`env.valueFrom.secretKeyRef`**: Injects a single Secret key (`password` from `db-credentials`) as an environment variable named `DB_PASSWORD`.

Apply this Deployment:

```
kubectl apply -f deployment.yaml
```

**Output:**

```
deployment.apps/api-server created
```

Verify the Pods received the configuration:

```
kubectl get pods -l app=api-server
```

**Output:**

```
NAME                         READY   STATUS    RESTARTS   AGEapi-server-5d8c7f9b4-7xvzq   1/1     Running   0          15sapi-server-5d8c7f9b4-kq9mfl   1/1     Running   0          15s
```

Check the environment inside a Pod:

```
kubectl exec -it api-server-5d8c7f9b4-7xvzq -- env | grep LOG_LEVEL
```

**Output:**

```
LOG_LEVEL=DEBUG
```

The Pod sees the configuration value. Verify the database password is also present:

```
kubectl exec -it api-server-5d8c7f9b4-7xvzq -- env | grep DB_PASSWORD
```

**Output:**

```
DB_PASSWORD=super-secret-password
```

* * *

## Mounting Configuration as Files

Sometimes your application expects configuration in files, not environment variables. Use volume mounts to inject ConfigMaps and Secrets as files.

### Mounting a ConfigMap as a Volume

Create a ConfigMap with file-like data:

```
apiVersion: v1kind: ConfigMapmetadata:  name: app-config-filesdata:  config.json: |    {      "database": "postgresql://localhost:5432/mydb",      "log_level": "DEBUG",      "features": {        "analytics": true,        "beta": false      }    }  settings.env: |    TIMEOUT=30    RETRIES=3
```

Now mount this ConfigMap as files in a Deployment:

```
apiVersion: apps/v1kind: Deploymentmetadata:  name: api-serverspec:  replicas: 1  selector:    matchLabels:      app: api-server  template:    metadata:      labels:        app: api-server    spec:      containers:      - name: api        image: myregistry/agent:v1.0        volumeMounts:        - name: config-volume          mountPath: /etc/config      volumes:      - name: config-volume        configMap:          name: app-config-files
```

Apply this Deployment:

```
kubectl apply -f deployment-with-volumes.yaml
```

**Output:**

```
deployment.apps/api-server created
```

Verify the files exist inside the Pod:

```
kubectl exec -it api-server-abc123-xyz -- ls -la /etc/config/
```

**Output:**

```
total 8drwxr-xr-x 3 root root   120 Dec 22 10:30 .drwxr-xr-x 1 root root  4096 Dec 22 10:30 ..-rw-r--r-- 1 root root   156 Dec 22 10:30 config.json-rw-r--r-- 1 root root    31 Dec 22 10:30 settings.env
```

Read the configuration file:

```
kubectl exec -it api-server-abc123-xyz -- cat /etc/config/config.json
```

**Output:**

```
{  "database": "postgresql://localhost:5432/mydb",  "log_level": "DEBUG",  "features": {    "analytics": true,    "beta": false  }}
```

### Mounting a Secret as a Volume

Mounting Secrets as files works identically to ConfigMaps:

```
apiVersion: apps/v1kind: Deploymentmetadata:  name: api-serverspec:  replicas: 1  selector:    matchLabels:      app: api-server  template:    metadata:      labels:        app: api-server    spec:      containers:      - name: api        image: myregistry/agent:v1.0        volumeMounts:        - name: secrets-volume          mountPath: /etc/secrets          readOnly: true      volumes:      - name: secrets-volume        secret:          secretName: db-credentials
```

Apply:

```
kubectl apply -f deployment-with-secrets.yaml
```

**Output:**

```
deployment.apps/api-server created
```

Verify the secret files exist:

```
kubectl exec -it api-server-def456-uvw -- cat /etc/secrets/password
```

**Output:**

```
super-secret-password
```

* * *

## Important: Base64 Encoding Is NOT Encryption

This is critical for security understanding: Kubernetes Secrets are base64-encoded, but **base64 is encoding, not encryption**. Anyone with access to the Secret object can decode it immediately.

```
kubectl get secret db-credentials -o yaml
```

```
data:  password: c3VwZXItc2VjcmV0LXBhc3N3b3Jk
```

This password is trivially decodable:

```
echo "c3VwZXItc2VjcmV0LXBhc3N3b3Jk" | base64 --decode
```

**Output:**

```
super-secret-password
```

**What this means for your deployments:**

1.  **Don't treat base64 as security**: Secrets are NOT secure by default in Kubernetes.
2.  **Use RBAC to control access**: Restrict who can `kubectl get secret`.
3.  **Enable encryption at rest**: Many Kubernetes distributions (AWS EKS, Google GKE, Azure AKS) support encrypting Secrets in the etcd database. Enable this in production.
4.  **Use external secret systems**: For highly sensitive credentials, consider external secret managers (HashiCorp Vault, AWS Secrets Manager) that integrate with Kubernetes.

For this course, understand that Secrets prevent credentials from being accidentally logged or displayed, but they're not cryptographically secure against someone with cluster access.

* * *

## Practice Exercises

### Exercise 1: Create a ConfigMap and Inject It

Create a ConfigMap named `agent-config` with these keys:

```
API_ENDPOINT=https://api.example.comTIMEOUT_SECONDS=30DEBUG_MODE=false
```

Then create a Pod that injects this ConfigMap as environment variables. Verify the Pod receives the configuration.

**Solution:**

```
kubectl create configmap agent-config \  --from-literal=API_ENDPOINT=https://api.example.com \  --from-literal=TIMEOUT_SECONDS=30 \  --from-literal=DEBUG_MODE=false
```

Create a Pod manifest:

```
apiVersion: v1kind: Podmetadata:  name: agent-podspec:  containers:  - name: agent    image: alpine    command: ["sh", "-c", "env | grep API_ENDPOINT && sleep 3600"]    envFrom:    - configMapRef:        name: agent-config  restartPolicy: Never
```

Apply and verify:

```
kubectl apply -f agent-pod.yamlkubectl exec -it agent-pod -- env | grep API_ENDPOINT
```

**Output:**

```
API_ENDPOINT=https://api.example.com
```

* * *

### Exercise 2: Create a Secret and Mount as Files

Create a Secret named `db-secrets` with:

```
username=postgrespassword=prod-db-passwordhost=db.example.com
```

Mount this Secret into a Pod at `/etc/db-secrets/` and verify you can read the files.

**Solution:**

```
kubectl create secret generic db-secrets \  --from-literal=username=postgres \  --from-literal=password=prod-db-password \  --from-literal=host=db.example.com
```

Create a Pod manifest:

```
apiVersion: v1kind: Podmetadata:  name: db-clientspec:  containers:  - name: client    image: alpine    command: ["sh", "-c", "cat /etc/db-secrets/password && sleep 3600"]    volumeMounts:    - name: db-secrets      mountPath: /etc/db-secrets      readOnly: true  volumes:  - name: db-secrets    secret:      secretName: db-secrets  restartPolicy: Never
```

Apply and verify:

```
kubectl apply -f db-client.yamlkubectl logs db-client
```

**Output:**

```
prod-db-password
```

* * *

### Exercise 3: Update a ConfigMap and Redeploy

Create a Deployment that uses a ConfigMap. Update the ConfigMap and observe whether the Pods automatically receive the new configuration.

**Solution:**

Create initial ConfigMap:

```
kubectl create configmap app-settings --from-literal=ENVIRONMENT=development
```

Create Deployment:

```
apiVersion: apps/v1kind: Deploymentmetadata:  name: env-printerspec:  replicas: 1  selector:    matchLabels:      app: env-printer  template:    metadata:      labels:        app: env-printer    spec:      containers:      - name: printer        image: alpine        command: ["sh", "-c", "echo $ENVIRONMENT && sleep 3600"]        env:        - name: ENVIRONMENT          valueFrom:            configMapKeyRef:              name: app-settings              key: ENVIRONMENT  restartPolicy: Never
```

Apply:

```
kubectl apply -f deployment.yamlkubectl logs -l app=env-printer
```

**Output:**

```
development
```

Now update the ConfigMap:

```
kubectl patch configmap app-settings -p '{"data":{"ENVIRONMENT":"production"}}'
```

**Important discovery**: The existing Pod still sees the old value. Kubernetes doesn't automatically reload ConfigMap changes into running Pods. To apply the new configuration, you must restart the Deployment:

```
kubectl rollout restart deployment/env-printerkubectl logs -l app=env-printer
```

**Output:**

```
production
```

This teaches an important lesson: ConfigMaps aren't "live"—they're read when the Pod starts. To update configuration, you redeploy the Pods.

* * *

## Try With AI

In this section, you'll collaborate with Claude to generate ConfigMaps and Secrets for your Part 6 agent.

### Part 1: Planning Your Configuration

Your Part 6 FastAPI agent needs external configuration. You'll ask Claude to help you design which values belong in ConfigMaps and which in Secrets.

Ask Claude:

```
I'm deploying a FastAPI agent to Kubernetes. The agent needs:- OpenAI API key (sensitive)- PostgreSQL database URL with credentials (sensitive)- Agent name for logging (non-sensitive)- Request timeout in seconds (non-sensitive)- Feature flags in JSON format (non-sensitive)- TLS certificate path (non-sensitive, but file-based)Which of these should go in ConfigMaps vs Secrets? Why? And provide the Kubernetes YAML manifests for both.
```

### Part 2: Critical Evaluation

Review Claude's response. Ask yourself:

-   Did Claude correctly classify sensitive vs non-sensitive data?
-   Did Claude create separate ConfigMap and Secret objects?
-   Does the YAML follow Kubernetes conventions (metadata, kind, apiVersion)?
-   Are the data keys clearly named?

### Part 3: Refinement

Based on your evaluation, tell Claude:

```
I like your classification. However, I also need:- Agent version (for the logs)- Maximum concurrent connections (for rate limiting)Can you update both manifests to include these? Also, in the Deployment template,show me how to inject the ConfigMap using envFrom and the Secret using individualvalueFrom references.
```

### Part 4: Validation

Claude generates an updated Deployment. Review it:

-   Does the ConfigMap injection use `envFrom.configMapRef`?
-   Does the Secret injection use `env[].valueFrom.secretKeyRef`?
-   Are all the configuration keys properly referenced?

### Part 5: Implementation Check

Ask Claude:

```
Now show me the complete Deployment YAML that injects both the ConfigMapand Secret, includes proper pod labels and replica count of 3, and includesa liveness probe on the /health endpoint. Also add a security note aboutwhy we're using Secrets here (not for cryptographic security, but foraccess control and to prevent accidental logging).
```

This exercises your ability to prompt Claude for iterative refinement of configuration manifests—a skill you'll use frequently when deploying to Kubernetes.

* * *

## Reflect on Your Skill

You built a `kubernetes-deployment` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my kubernetes-deployment skill, inject configuration using ConfigMaps and Secrets.Does my skill generate environment variable injection using envFrom and valueFrom patterns?
```

### Identify Gaps

Ask yourself:

-   Did my skill include ConfigMap creation from literals and YAML manifests?
-   Did it explain Secret creation and the base64 encoding (not encryption) caveat?
-   Did it cover both environment variable injection and volume mount patterns?
-   Did it include security warnings about Secret management in production?

### Improve Your Skill

If you found gaps:

```
My kubernetes-deployment skill is missing ConfigMap and Secret injection patterns.Update it to include envFrom, valueFrom, and volume mount configurations, plus security best practices for Secrets.
```

* * *

Checking access...

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 50: Kubernetes for AI Services](/docs/AI-Cloud-Native-Development/kubernetes-for-ai-services)
-   Resource Management and Debugging

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/50-kubernetes-for-ai-services/08-resource-management-and-debugging.md)

# Resource Management and Debugging

Your Kubernetes cluster is running Pods. Everything works perfectly in development. Then you deploy to production.

Your Pod crashes immediately. Or it stays Pending forever. Or it consumes all memory and gets evicted. You don't know why—you just see error states and no explanation.

This lesson teaches you to read what the cluster is trying to tell you. Kubernetes provides signals about Pod failures: status fields, events, logs, and resource constraints. Learning to interpret these signals is the difference between a 5-minute fix and hours of frustration.

* * *

## Concept 1: Resource Requests and Limits

Before diving into debugging, you need to understand how Kubernetes allocates resources.

### The Mental Model: Requests vs Limits

Think of resource management like renting an apartment:

-   **Request**: "I need at least 2 bedrooms"—the landlord won't accept your application if they have fewer. This is your GUARANTEED minimum.
-   **Limit**: "My apartment can have at most 3 bedrooms"—you don't need more than this. If you try to use 4, you get evicted.

In Kubernetes:

```
resources:  requests:    memory: "256Mi"    # Guaranteed minimum    cpu: "100m"        # for scheduling decisions  limits:    memory: "512Mi"    # Maximum allowed    cpu: "500m"        # can't exceed this
```

**Key Principle**: A Pod cannot be scheduled on a node unless that node has at least the REQUESTED amount of free resources. Limits prevent a Pod from monopolizing node resources.

### Why This Matters

Requests enable fair scheduling. If you have 3 Pods:

-   Pod A requests 1 CPU
-   Pod B requests 1 CPU
-   Pod C requests 1 CPU

Kubernetes won't schedule all three on a 2-CPU node. Request prevents overcommitment.

Limits enable isolation. If Pod A starts consuming 2 CPUs (more than its limit), Kubernetes throttles it. Pod B doesn't starve because Pod A went rogue.

### CPU and Memory Units

**CPU**:

-   `1000m` = 1 CPU core
-   `100m` = 0.1 CPU cores (100 millicores)
-   `0.5` = half a CPU core (also written as `500m`)

**Memory**:

-   `1Mi` = 1 mebibyte (~1 million bytes, technically 1048576 bytes)
-   `1Gi` = 1 gibibyte (~1 billion bytes)
-   `256Mi` = 256 mebibytes (typical for small services)
-   `1Gi` = 1 gibibyte (typical for memory-intensive services)

Always use `Mi` and `Gi` (binary) not `MB` and `GB` (decimal) in Kubernetes manifests. They're different.

* * *

## Concept 2: Quality of Service (QoS) Classes

Kubernetes prioritizes which Pods to evict when a node runs out of resources. This priority is determined by the Pod's **QoS class**.

### The Three QoS Classes

**Guaranteed** (Highest Priority)

```
resources:  requests:    memory: "256Mi"    cpu: "100m"  limits:    memory: "256Mi"    cpu: "100m"
```

When requests equal limits, the Pod is Guaranteed. Kubernetes evicts Guaranteed Pods LAST. Use this for critical workloads (databases, control planes).

**Burstable** (Medium Priority)

```
resources:  requests:    memory: "256Mi"    cpu: "100m"  limits:    memory: "512Mi"    cpu: "500m"
```

When requests < limits, the Pod is Burstable. Kubernetes evicts Burstable Pods second. Use this for normal workloads (most services, agents).

**BestEffort** (Lowest Priority)

```
resources: {}  # No requests or limits
```

When a Pod has no requests or limits, it's BestEffort. Kubernetes evicts these FIRST when memory pressure occurs. Only use this for batch jobs, not for Pods that need to stay running.

### The Eviction Decision

Imagine your cluster is out of memory and needs to evict a Pod:

1.  Check BestEffort Pods first—evict one
2.  If memory pressure continues, evict Burstable Pods
3.  Only if nothing else works, evict Guaranteed Pods

This hierarchy ensures critical workloads stay running when resources are tight.

* * *

## Concept 3: Common Pod Failure States

Pods fail in predictable ways. Each failure state has a specific cause and fix pattern.

### CrashLoopBackOff

**What you see**:

```
NAME    READY   STATUS             RESTARTS   AGEmyapp   0/1     CrashLoopBackOff   5          2m
```

**What it means**: The container started, then crashed, then restarted, then crashed again. This cycle repeats 5+ times.

**Root causes**:

1.  Application error (bug in code)
2.  Missing environment variable
3.  Missing configuration file
4.  Port already in use
5.  Out of memory

**Fix pattern**:

1.  Check logs: `kubectl logs <pod-name>` (shows why it crashed)
2.  Check if limit was hit: `kubectl describe pod <pod-name>` (look for OOMKilled)
3.  Fix the underlying issue in your manifest or code
4.  Delete and recreate the Pod

### ImagePullBackOff

**What you see**:

```
NAME    READY   STATUS             RESTARTS   AGEmyapp   0/1     ImagePullBackOff   0          1m
```

**What it means**: Kubernetes tried to pull the container image but failed.

**Root causes**:

1.  Image doesn't exist in registry
2.  Wrong image name or tag
3.  Registry credentials missing (private images)
4.  Network unreachable (can't reach registry)

**Fix pattern**:

1.  Check the event: `kubectl describe pod <pod-name>` (look for "Failed to pull image")
2.  Verify image name: `kubectl get pod -o yaml <pod-name>` (find exact image reference)
3.  Test locally: `docker pull <image-name>` (can you pull it on your laptop?)
4.  Fix the image reference in your manifest
5.  Apply the manifest again

### Pending

**What you see**:

```
NAME    READY   STATUS    RESTARTS   AGEmyapp   0/1     Pending   0          5m
```

**What it means**: Kubernetes is trying to schedule the Pod, but no node has enough resources.

**Root causes**:

1.  Requested resources exceed cluster capacity
2.  Node affinity requirements not met
3.  Pod is waiting for PersistentVolume
4.  Node taint prevents Pod scheduling

**Fix pattern**:

1.  Check events: `kubectl describe pod <pod-name>` (shows why scheduling failed)
2.  Check node resources: `kubectl top nodes` (are nodes overcommitted?)
3.  Reduce Pod requests if they're too high
4.  Add more nodes to the cluster
5.  Check tolerations and affinity rules

### OOMKilled

**What you see** (in describe output):

```
State:       Waiting  Reason:    CrashLoopBackOffLastState:   Terminated  Reason:    OOMKilled  Exit Code: 137
```

**What it means**: The container consumed more memory than its limit, so Kubernetes forcefully terminated it.

**Root causes**:

1.  Application has a memory leak
2.  Limit is too low for the workload
3.  Processing unexpectedly large dataset

**Fix pattern**:

1.  Increase memory limit (if limit is genuinely too low)
2.  Profile the application (use tools like `pprof` for Python/Go)
3.  Fix the memory leak in code
4.  Change the application to process data in chunks instead of all at once

* * *

## Concept 4: The Debugging Pattern

Kubernetes provides four signals for debugging. Learn to read them in order.

### Signal 1: Pod Status

```
kubectl get pods
```

**Output**:

```
NAME              READY   STATUS             RESTARTS   AGEnginx-good        1/1     Running            0          5mnginx-crash       0/1     CrashLoopBackOff   3          2mnginx-pending     0/1     Pending            0          1m
```

Status tells you WHAT is wrong (CrashLoopBackOff, Pending, etc.). But not WHY. Continue to Signal 2.

### Signal 2: Events

```
kubectl describe pod <pod-name>
```

**Output** (partial):

```
Name:         nginx-crashNamespace:    default...Events:  Type    Reason     Age    Message  ----    ------     ---    -------  Normal  Created    2m20s  Created container nginx  Normal  Started    2m19s  Started container nginx  Warning BackOff    2m10s  Back-off restarting failed container
```

Events show WHEN things happened and provide clues (like "restarting failed container"). For Pending Pods, events reveal scheduling reasons.

### Signal 3: Logs

```
kubectl logs <pod-name>
```

**Output** (if app crashed):

```
Traceback (most recent call last):  File "app.py", line 5, in <module>    connect_to_db()  File "app.py", line 2, in connect_to_db    raise Exception("Database not found")Exception: Database not found
```

Logs show the APPLICATION'S error message. This is where you find the root cause (missing env var, code bug, etc.).

For Pending Pods, logs are empty (Pod never started). Check events instead.

### Signal 4: Interactive Access

```
kubectl exec -it <pod-name> -- /bin/bash
```

When the above three signals aren't enough, jump into the running Pod and investigate directly.

```
# Inside the Pod$ env          # Check environment variables$ ls -la       # Check filesystem$ ps aux       # Check running processes$ curl localhost:8080  # Test internal services
```

This is your "last resort" debugging tool. Use when you need to poke around interactively.

* * *

## Putting It Together: The Debugging Workflow

When a Pod fails:

1.  **Get status**: `kubectl get pods` (What's the state?)
2.  **Describe**: `kubectl describe pod <name>` (Why is it in that state? Are there events?)
3.  **Check logs**: `kubectl logs <name>` (What did the application say?)
4.  **Investigate interactively**: `kubectl exec -it <name> -- /bin/bash` (What's actually happening inside?)
5.  **Fix**: Modify manifest or code based on findings
6.  **Apply**: `kubectl apply -f manifest.yaml`
7.  **Verify**: `kubectl get pods` (Did it work?)

This pattern works for 95% of Kubernetes debugging.

* * *

## Practice 1: Diagnose CrashLoopBackOff

Create a Pod that crashes due to a missing environment variable.

**Manifest** (save as `crash-loop.yaml`):

```
apiVersion: v1kind: Podmetadata:  name: crash-loop-appspec:  containers:  - name: app    image: python:3.11-slim    command: ["python", "-c"]    args:      - |        import os        db_url = os.environ['DATABASE_URL']        print(f"Connecting to {db_url}")    resources:      requests:        memory: "64Mi"        cpu: "50m"      limits:        memory: "128Mi"        cpu: "100m"  restartPolicy: Always
```

**Deploy it**:

```
kubectl apply -f crash-loop.yaml
```

**Output**:

```
pod/crash-loop-app created
```

**Check status** (after 30 seconds):

```
kubectl get pods
```

**Output**:

```
NAME              READY   STATUS             RESTARTS   AGEcrash-loop-app    0/1     CrashLoopBackOff   2          35s
```

**Describe to see events**:

```
kubectl describe pod crash-loop-app
```

**Output** (relevant section):

```
Events:  Type     Reason            Age   Message  ----     ------            ---   -------  Normal   Scheduled         45s   Successfully assigned default/crash-loop-app  Normal   Created           44s   Created container app  Normal   Started           43s   Started container app  Warning  BackOff           20s   Back-off restarting failed container
```

**Check logs to see the actual error**:

```
kubectl logs crash-loop-app
```

**Output**:

```
Traceback (most recent call last):  File "<string>", line 2, in <module>db_url = os.environ['DATABASE_URL']KeyError: 'DATABASE_URL'
```

**Diagnosis**: The application expects `DATABASE_URL` environment variable but it's not set.

**Fix**: Add the environment variable to the manifest:

```
apiVersion: v1kind: Podmetadata:  name: crash-loop-appspec:  containers:  - name: app    image: python:3.11-slim    command: ["python", "-c"]    args:      - |        import os        db_url = os.environ['DATABASE_URL']        print(f"Connecting to {db_url}")    env:    - name: DATABASE_URL      value: "postgres://localhost:5432/mydb"    resources:      requests:        memory: "64Mi"        cpu: "50m"      limits:        memory: "128Mi"        cpu: "100m"  restartPolicy: Always
```

**Apply the fix**:

```
kubectl apply -f crash-loop.yaml
```

**Output**:

```
pod/crash-loop-app configured
```

**Check status**:

```
kubectl get pods
```

**Output**:

```
NAME              READY   STATUS    RESTARTS   AGEcrash-loop-app    1/1     Running   0          5s
```

**Check logs to confirm it's working**:

```
kubectl logs crash-loop-app
```

**Output**:

```
Connecting to postgres://localhost:5432/mydb
```

Notice the Pod transitions from CrashLoopBackOff to Running. The restart counter resets because the underlying issue is fixed.

**Clean up**:

```
kubectl delete pod crash-loop-app
```

* * *

## Practice 2: Diagnose Pending Pod Due to Insufficient Resources

Create a Pod that requests more resources than available.

**Manifest** (save as `pending-pod.yaml`):

```
apiVersion: v1kind: Podmetadata:  name: memory-hogspec:  containers:  - name: app    image: python:3.11-slim    command: ["sleep", "3600"]    resources:      requests:        memory: "100Gi"    # Way more than any node has        cpu: "50"          # Way more cores than available      limits:        memory: "100Gi"        cpu: "50"  restartPolicy: Always
```

**Deploy it**:

```
kubectl apply -f pending-pod.yaml
```

**Output**:

```
pod/memory-hog created
```

**Check status**:

```
kubectl get pods
```

**Output**:

```
NAME         READY   STATUS    RESTARTS   AGEmemory-hog   0/1     Pending   0          10s
```

**Describe to see why it's Pending**:

```
kubectl describe pod memory-hog
```

**Output** (relevant section):

```
Events:  Type     Reason            Age   Message  ----     ------            ---   -------  Warning  FailedScheduling  15s   0/1 nodes are available: 1 Insufficient memory (requires 100Gi, but nodes only have ~5Gi free).
```

**Diagnosis**: The Pod requests 100Gi of memory, but no node has that much available. Kubernetes cannot schedule it.

**Fix**: Reduce the resource requests to reasonable values:

```
apiVersion: v1kind: Podmetadata:  name: memory-hogspec:  containers:  - name: app    image: python:3.11-slim    command: ["sleep", "3600"]    resources:      requests:        memory: "256Mi"    # Reasonable request        cpu: "100m"      limits:        memory: "512Mi"        cpu: "500m"  restartPolicy: Always
```

**Apply the fix**:

```
kubectl apply -f pending-pod.yaml
```

**Output**:

```
pod/memory-hog configured
```

**Check status**:

```
kubectl get pods
```

**Output**:

```
NAME         READY   STATUS    RESTARTS   AGEmemory-hog   1/1     Running   0          5s
```

Pod transitions from Pending to Running.

**Clean up**:

```
kubectl delete pod memory-hog
```

* * *

## Practice 3: Diagnose OOMKilled and Adjust Limits

Create a Pod that exceeds its memory limit.

**Manifest** (save as `oom-pod.yaml`):

```
apiVersion: v1kind: Podmetadata:  name: memory-leak-appspec:  containers:  - name: app    image: python:3.11-slim    command: ["python", "-c"]    args:      - |        import time        memory = []        while True:            # Allocate 50MB every 100ms            memory.append(bytearray(50 * 1024 * 1024))            time.sleep(0.1)    resources:      requests:        memory: "256Mi"        cpu: "100m"      limits:        memory: "256Mi"    # Limit memory to 256Mi        cpu: "500m"  restartPolicy: Always
```

**Deploy it**:

```
kubectl apply -f oom-pod.yaml
```

**Output**:

```
pod/memory-leak-app created
```

**Check status immediately**:

```
kubectl get pods
```

**Output** (within a few seconds):

```
NAME               READY   STATUS             RESTARTS   AGEmemory-leak-app    0/1     CrashLoopBackOff   1          5s
```

**Describe to see the termination reason**:

```
kubectl describe pod memory-leak-app
```

**Output** (relevant section):

```
State:          Waiting  Reason:       CrashLoopBackOffLast State:     Terminated  Reason:       OOMKilled  Exit Code:    137  Message:      The container was killed due to an out-of-memory condition.
```

**Diagnosis**: The application consumes memory faster than the 256Mi limit allows. Kubernetes kills it with OOMKilled.

**Fix Options**:

1.  **Increase the limit** (if the application actually needs more memory):

```
resources:  requests:    memory: "512Mi"    cpu: "100m"  limits:    memory: "1Gi"      # Increase limit    cpu: "500m"
```

2.  **Fix the memory leak** (if there's a bug):

```
args:  - |    import time    memory = []    while True:        # Only keep last 5 allocations (500MB max)        if len(memory) > 5:            memory.pop(0)        memory.append(bytearray(50 * 1024 * 1024))        time.sleep(0.1)
```

For this example, let's increase the limit:

```
kubectl apply -f oom-pod.yaml
```

**Check status**:

```
kubectl get pods
```

**Output**:

```
NAME               READY   STATUS    RESTARTS   AGEmemory-leak-app    1/1     Running   0          5s
```

If the Pod stays running (not crashing), the limit was the issue. If it still crashes with the higher limit, there's a memory leak in the code that needs fixing.

**Clean up**:

```
kubectl delete pod memory-leak-app
```

* * *

## Resource Management Best Practices

**1\. Always set requests and limits for production Pods**

```
resources:  requests:    memory: "256Mi"    cpu: "100m"  limits:    memory: "512Mi"    cpu: "500m"
```

This ensures fair scheduling and prevents Pod eviction.

**2\. Make requests equal to limits for critical workloads** (Guaranteed QoS)

```
resources:  requests:    memory: "512Mi"    cpu: "250m"  limits:    memory: "512Mi"    cpu: "250m"
```

This prevents your Pod from being evicted when other Pods fail.

**3\. Start conservative and increase based on monitoring**

Set requests low (`100m` CPU, `128Mi` memory) for new services, then monitor actual usage:

```
kubectl top pods    # Shows actual CPU/memory usage
```

Increase requests based on observed usage + 20% headroom.

**4\. Use namespaces to isolate resource quotas**

```
apiVersion: v1kind: Namespacemetadata:  name: ai-services---apiVersion: v1kind: ResourceQuotametadata:  name: ai-quota  namespace: ai-servicesspec:  hard:    requests.memory: "10Gi"    # All Pods in namespace combined    requests.cpu: "5"
```

* * *

## Try With AI

You now have the mental models and debugging workflow. Let's collaborate with AI to troubleshoot a complex scenario.

**Setup**: Deploy a multi-container Pod with intentional resource and configuration issues. Use kubectl commands to inspect it, then iterate with AI to fix problems.

**Your Assignment**:

Create this manifest (save as `complex-pod.yaml`):

```
apiVersion: v1kind: Podmetadata:  name: multi-container-appspec:  containers:  - name: web    image: nginx:1.25    ports:    - containerPort: 8080    env:    - name: ENVIRONMENT      value: "production"    resources:      requests:        memory: "64Mi"        cpu: "50m"      limits:        memory: "128Mi"        cpu: "100m"  - name: sidecar    image: curlimages/curl:latest    command: ["sleep", "3600"]    resources:      requests:        memory: "32Mi"        cpu: "25m"      limits:        memory: "64Mi"        cpu: "50m"  restartPolicy: Always
```

**Step 1: Deploy and diagnose**

```
kubectl apply -f complex-pod.yamlkubectl get podskubectl describe pod multi-container-appkubectl logs multi-container-app -c webkubectl logs multi-container-app -c sidecar
```

**Step 2: Ask AI for analysis**

Tell AI: "I've deployed a multi-container Pod with nginx and curl sidecar. Here are the kubectl outputs: \[paste describe and logs\]. What QoS class is this Pod? How would you monitor resource usage? What would happen if CPU requests were set to 50 instead of 50m?"

**Step 3: Interactive exploration**

Jump into the Pod and verify:

```
kubectl exec -it multi-container-app -c web -- /bin/sh$ ps aux              # Check if nginx is running$ netstat -tlnp       # Check port bindings$ env                 # Verify environment variables$ exit
```

**Step 4: Propose a modification**

Based on AI's suggestions, modify the manifest to:

-   Change sidecar image to a production-ready one
-   Add a liveness probe to the web container
-   Adjust resource requests based on typical nginx usage

Ask AI: "Given that nginx typically uses 20-50m CPU and 50-100Mi memory in production, what requests and limits would you recommend? Should this be Guaranteed or Burstable?"

**Step 5: Validate and explain**

Apply your modified manifest:

```
kubectl apply -f complex-pod.yamlkubectl get podskubectl top pod multi-container-app     # View actual resource usage
```

Explain to AI:

-   Why your resource choices match the QoS class you selected
-   What signals you'd monitor to detect problems before they become critical
-   How you'd adjust resources if you observed Pod eviction in a high-load scenario

**Clean up**:

```
kubectl delete pod multi-container-app
```

* * *

## Reflect on Your Skill

You built a `kubernetes-deployment` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my kubernetes-deployment skill, debug a Pod stuck in CrashLoopBackOff.Does my skill include the debugging workflow: get pods, describe pod, logs, and exec for inspection?
```

### Identify Gaps

Ask yourself:

-   Did my skill include resource requests and limits with proper QoS class understanding?
-   Did it explain the debugging pattern (status → describe → logs → exec)?
-   Did it cover common failure states (CrashLoopBackOff, ImagePullBackOff, Pending, OOMKilled)?
-   Did it include resource management best practices (requests = baseline, limits = ceiling)?

### Improve Your Skill

If you found gaps:

```
My kubernetes-deployment skill is missing debugging workflows and resource management patterns.Update it to include the systematic debugging approach, failure state diagnosis, and QoS class configuration.
```

* * *

Checking access...

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 50: Kubernetes for AI Services](/docs/AI-Cloud-Native-Development/kubernetes-for-ai-services)
-   Horizontal Pod Autoscaler for AI Agents

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/50-kubernetes-for-ai-services/09-hpa-autoscaling.md)

# Horizontal Pod Autoscaler for AI Agents

Your agent deployment is running smoothly on Kubernetes. Traffic arrives in waves: quiet periods, then sudden bursts when multiple users send inference requests simultaneously.

If you set replicas to handle peak load, you're wasting money on idle Pods during quiet periods. If you set replicas for average load, you're rejecting requests during spikes.

Kubernetes solves this with the Horizontal Pod Autoscaler (HPA). It watches CPU usage (or memory, or custom metrics) and automatically scales Pods up when demand rises and down when demand falls. You specify min and max replicas; HPA keeps the cluster balanced between them.

This lesson teaches you how HPA works, why it matters for AI agents, and how to configure it on Docker Desktop Kubernetes.

* * *

## Concept 1: Why Autoscaling Matters for AI Agents

AI inference workloads have unpredictable demand. Unlike web servers that handle requests with minimal CPU, inference requests are CPU-intensive:

-   **During quiet periods**: 2-3 agent replicas handle light traffic efficiently. Extra replicas waste compute.
-   **During spike**: 20+ users send inference requests simultaneously. Without autoscaling, requests queue and timeout.
-   **Custom metrics**: Some agents measure "queue depth" or "inference latency" as scaling triggers, not just CPU.

HPA solves this by:

1.  **Continuous monitoring**: Kubernetes measures resource usage of every Pod
2.  **Automatic scaling**: When CPU exceeds threshold (e.g., 50%), scale up
3.  **Stabilization**: Wait before scaling down to prevent thrashing (replicas flickering up/down constantly)
4.  **Cost optimization**: Run only as many replicas as needed

The mental model: HPA is a feedback loop that keeps your cluster right-sized to current demand.

* * *

## Concept 2: Metrics Server — The Eyes of the Cluster

Before HPA can scale, it needs to measure Pod resource usage. This is the job of the **metrics-server**, a cluster component that collects CPU and memory metrics from every container.

### How Metrics Flow

```
kubelet (on each node)  ↓ reads actual CPU/memory  ↓metrics-server  ↓ aggregates metrics  ↓HPA controller  ↓ reads metrics, decides to scale  ↓Deployment  ↓ scales replicas up/down
```

**Key insight**: HPA without metrics-server cannot function. The cluster won't scale because it has nothing to measure.

### Checking if metrics-server is running

On your Docker Desktop Kubernetes cluster:

```
kubectl get deployment -n kube-system | grep metrics-server
```

**Output**:

```
metrics-server   1/1     1            1           2m
```

If metrics-server is not listed, you need to install it.

* * *

## Concept 3: HPA Resources — The Configuration

An HPA resource is a declarative configuration that tells Kubernetes:

-   Which Deployment to scale
-   What metric to monitor (CPU, memory, custom)
-   What threshold to trigger scaling (e.g., "when CPU exceeds 50%")
-   Min and max replica limits

### Anatomy of an HPA

```
apiVersion: autoscaling/v2kind: HorizontalPodAutoscalermetadata:  name: agent-scalerspec:  scaleTargetRef:    apiVersion: apps/v1    kind: Deployment    name: my-agent  minReplicas: 2          # Never scale below 2  maxReplicas: 10         # Never scale above 10  metrics:  - type: Resource    resource:      name: cpu      target:        type: Utilization        averageUtilization: 50  # Scale up when avg CPU > 50%  behavior:                      # Advanced: control scaling speed    scaleDown:      stabilizationWindowSeconds: 300    scaleUp:      stabilizationWindowSeconds: 0
```

**Breaking it down**:

-   **scaleTargetRef**: Which Deployment does this HPA manage?
-   **minReplicas/maxReplicas**: Bounds on how many Pods can exist
-   **metrics**: What to measure and at what threshold
-   **behavior**: Fine-tune scaling speed (we'll explain this next)

* * *

## Concept 4: Scaling Behavior — scaleUp vs scaleDown

HPA scales in two directions. They have different behaviors to prevent problems.

### scaleUp Behavior

When CPU exceeds the target (50% in our example):

1.  **Calculate desired replicas**: If 3 Pods are using 70% CPU each, and target is 50%, we need 3 × (70/50) = 4.2 → round to 5 Pods
2.  **Stabilization window**: By default, scale up immediately (stabilizationWindowSeconds: 0)
3.  **Max scale-up per minute**: Kubernetes limits how fast replicas can increase (prevents runaway)

**Example**:

-   Current: 3 replicas, 70% CPU each
-   Target: 50% CPU
-   Desired: 5 replicas
-   Action: Create 2 new Pods immediately

### scaleDown Behavior

When CPU falls below the target:

1.  **Calculate desired replicas**: If 10 Pods are using 20% CPU each, and target is 50%, we need 10 × (20/50) = 4 Pods
2.  **Stabilization window**: Wait 300 seconds (5 minutes) before scaling down
3.  **Why the wait?**: Prevent thrashing. If a spike is brief (2 minutes), you don't want to scale down then back up immediately.

**Example**:

-   Current: 10 replicas, 20% CPU each
-   Target: 50% CPU
-   Desired: 4 replicas
-   Decision: Wait 5 minutes, then remove 6 Pods

**Key principle**: Scale up fast (respond to spikes), scale down slow (don't over-react to dips).

* * *

## Concept 5: Stabilization Windows — Preventing Thrashing

A stabilization window prevents HPA from making rapid, contradictory scaling decisions.

### The Problem Without Stabilization

Imagine no stabilization:

```
Time    CPU   Replicas   Decision0s      75%   3          Scale to 530s     48%   5          Scale down to 260s     80%   2          Scale to 490s     35%   4          Scale down to 2
```

Replicas are constantly changing. This causes:

-   Pod churn (containers starting/stopping repeatedly)
-   Cascading failures (new Pods crash due to overload)
-   Cost thrashing (your bill fluctuates wildly)

### The Solution: Stabilization Windows

**scaleUp stabilization**: Watch for at least N seconds of sustained high CPU before scaling up **scaleDown stabilization**: Wait N seconds after CPU drops before removing Pods

With 300-second scaleDown stabilization:

```
Time    CPU   Replicas   Decision0s      75%   3          Scale to 530s     48%   5          (wait 300s before considering scale down)120s    40%   5          (still waiting)300s    35%   5          Now eligible for scale down → scale to 2
```

In this scenario, the brief 30-second dip doesn't trigger scale down. Only sustained low CPU causes reduction.

* * *

## Practice 1: Verify metrics-server on Docker Desktop

Docker Desktop's Kubernetes includes metrics-server by default. Verify it's running:

```
kubectl get deployment metrics-server -n kube-system
```

**Output**:

```
NAME             READY   UP-TO-DATE   AVAILABLE   AGEmetrics-server   1/1     1            1           10s
```

Wait 30 seconds for metrics to accumulate, then check if metrics are available:

```
kubectl top nodes
```

**Output**:

```
NAME             CPU(cores)   CPU%   MEMORY(Mi)   MEMORY%docker-desktop   542m         13%    1247Mi       16%
```

If this shows CPU and memory percentages, metrics-server is working. If it shows `<unknown>`, wait another 30 seconds and retry.

* * *

## Practice 2: Create a Deployment to Scale

Create a simple deployment that consumes CPU when stressed.

**Manifest** (save as `agent-deployment.yaml`):

```
apiVersion: apps/v1kind: Deploymentmetadata:  name: my-agentspec:  replicas: 2  selector:    matchLabels:      app: agent  template:    metadata:      labels:        app: agent    spec:      containers:      - name: agent        image: python:3.11-slim        command: ["python", "-c"]        args:          - |            import time            while True:              # Simple busy loop to consume CPU              for i in range(1000000):                _ = i * 2              time.sleep(0.1)        resources:          requests:            cpu: 100m            memory: 128Mi          limits:            cpu: 500m            memory: 256Mi
```

Deploy it:

```
kubectl apply -f agent-deployment.yaml
```

**Output**:

```
deployment.apps/my-agent created
```

Verify Pods are running:

```
kubectl get pods -l app=agent
```

**Output**:

```
NAME                       READY   STATUS    RESTARTS   AGEmy-agent-7c8f8d4b5-abc12   1/1     Running   0          10smy-agent-7c8f8d4b5-def45   1/1     Running   0          10s
```

Check CPU usage:

```
kubectl top pods -l app=agent
```

**Output**:

```
NAME                       CPU(m)   MEMORY(Mi)my-agent-7c8f8d4b5-abc12   450m     45Mimy-agent-7c8f8d4b5-def45   420m     42Mi
```

Each Pod is using ~450m CPU (450 millicores). Since the limit is 500m, they're near their maximum.

* * *

## Practice 3: Create an HPA

Now create an HPA that scales this deployment based on CPU.

**Manifest** (save as `agent-hpa.yaml`):

```
apiVersion: autoscaling/v2kind: HorizontalPodAutoscalermetadata:  name: agent-scalerspec:  scaleTargetRef:    apiVersion: apps/v1    kind: Deployment    name: my-agent  minReplicas: 2  maxReplicas: 10  metrics:  - type: Resource    resource:      name: cpu      target:        type: Utilization        averageUtilization: 50  behavior:    scaleDown:      stabilizationWindowSeconds: 300    scaleUp:      stabilizationWindowSeconds: 0
```

Deploy the HPA:

```
kubectl apply -f agent-hpa.yaml
```

**Output**:

```
horizontalpodautoscaler.autoscaling/agent-scaler created
```

Check the HPA status:

```
kubectl get hpa
```

**Output**:

```
NAME           REFERENCE           TARGETS   MINPODS   MAXPODS   REPLICAS   AGEagent-scaler   Deployment/my-agent 90%/50%   2         10        2          15s
```

The `TARGETS` column shows `90%/50%`. This means:

-   **Actual usage**: 90% (average of all Pods' CPU)
-   **Target**: 50%

Since 90% > 50%, the HPA should decide to scale up. Let's watch it happen:

```
kubectl get hpa -w
```

**Output** (watch continuously updates):

```
NAME           REFERENCE           TARGETS   MINPODS   MAXPODS   REPLICAS   AGEagent-scaler   Deployment/my-agent 90%/50%   2         10        2          20sagent-scaler   Deployment/my-agent 90%/50%   2         10        3          22sagent-scaler   Deployment/my-agent 85%/50%   2         10        4          25sagent-scaler   Deployment/my-agent 70%/50%   2         10        5          30sagent-scaler   Deployment/my-agent 55%/50%   2         10        6          35sagent-scaler   Deployment/my-agent 48%/50%   2         10        6          40sagent-scaler   Deployment/my-agent 48%/50%   2         10        6          45s
```

**What happened**:

1.  **Time 20s**: HPA detected 90% CPU > 50% target
2.  **Time 22s**: Scaled from 2 to 3 replicas
3.  **Time 25s**: Scaled to 4 replicas
4.  **Time 30s**: Scaled to 5 replicas
5.  **Time 35s**: Scaled to 6 replicas
6.  **Time 40s+**: CPU stabilized at 48%, which is below target. HPA stops scaling.

Check the Pods:

```
kubectl get pods -l app=agent
```

**Output**:

```
NAME                       READY   STATUS    RESTARTS   AGEmy-agent-7c8f8d4b5-abc12   1/1     Running   0          3mmy-agent-7c8f8d4b5-def45   1/1     Running   0          3mmy-agent-7c8f8d4b5-gh123   1/1     Running   0          2mmy-agent-7c8f8d4b5-ij456   1/1     Running   0           1m 50smy-agent-7c8f8d4b5-kl789   1/1     Running   0           1m 20smy-agent-7c8f8d4b5-op012   1/1     Running   0           50s
```

Six Pods are running. CPU is now distributed: each Pod uses less CPU because work is spread across more containers.

* * *

## Practice 4: Trigger Scale Down

Now let's reduce CPU load and watch HPA scale down.

Delete the Deployment (which stops the busy loop):

```
kubectl delete deployment my-agent
```

**Output**:

```
deployment.apps "my-agent" deleted
```

Check the HPA:

```
kubectl get hpa
```

**Output**:

```
NAME           REFERENCE           TARGETS         MINPODS   MAXPODS   REPLICAS   AGEagent-scaler   Deployment/my-agent <unknown>/50%   2         10        6          3m
```

The `TARGETS` column shows `<unknown>` because the Deployment no longer exists. HPA can't scale it.

Let's recreate the Deployment with a lower-CPU workload:

```
apiVersion: apps/v1kind: Deploymentmetadata:  name: my-agentspec:  replicas: 1  selector:    matchLabels:      app: agent  template:    metadata:      labels:        app: agent    spec:      containers:      - name: agent        image: python:3.11-slim        command: ["python", "-c"]        args:          - |            import time            while True:              time.sleep(1)        resources:          requests:            cpu: 100m            memory: 128Mi          limits:            cpu: 500m            memory: 256Mi
```

Deploy it:

```
kubectl apply -f agent-deployment.yaml
```

**Output**:

```
deployment.apps/my-agent created
```

Watch HPA:

```
kubectl get hpa -w
```

**Output**:

```
NAME           REFERENCE           TARGETS   MINPODS   MAXPODS   REPLICAS   AGEagent-scaler   Deployment/my-agent 5%/50%    2         10        6          3magent-scaler   Deployment/my-agent 5%/50%    2         10        6          3m 30sagent-scaler   Deployment/my-agent 5%/50%    2         10        6          4m 30sagent-scaler   Deployment/my-agent 5%/50%    2         10        2          5m 20s
```

**What happened**:

1.  **0-4m 30s**: CPU is 5%, below 50% target. HPA calculates desired replicas: 6 × (5/50) = 0.6 → rounds to 1. But minReplicas is 2, so HPA can't scale below 2.
2.  **4m 30s-5m**: HPA waits during stabilization window (300 seconds = 5 minutes)
3.  **5m 20s**: Stabilization complete, HPA scales down to 2 replicas (the minimum)

The stabilization window prevented HPA from immediately thrashing. It waited 5 minutes of sustained low CPU before scaling down.

* * *

## Understanding Scaling Math

HPA calculates desired replicas with this formula:

```
desired_replicas = ceil(current_replicas × (current_usage / target))
```

**Example 1: Scale up**

-   Current replicas: 2
-   Current CPU usage: 80%
-   Target: 50%
-   Desired: ceil(2 × (80/50)) = ceil(3.2) = 4 replicas

**Example 2: Scale down**

-   Current replicas: 6
-   Current CPU usage: 20%
-   Target: 50%
-   Desired: ceil(6 × (20/50)) = ceil(2.4) = 3 replicas

This explains why HPA scales up faster than down:

-   **Up**: 2 Pods at 80% → need 4 Pods (2x increase)
-   **Down**: 6 Pods at 20% → need 3 Pods (only 50% reduction)

HPA always prefers to provision more Pods than fewer, ensuring requests don't get rejected.

* * *

## Best Practices for AI Agent Autoscaling

**1\. Set requests and limits appropriately**

```
resources:  requests:    cpu: 200m    memory: 256Mi  limits:    cpu: 1000m    memory: 1Gi
```

HPA scales based on **requested** CPU, not used CPU. Requests must reflect what your agent actually needs at baseline.

**2\. Use a target utilization between 50-80%**

```
target:  averageUtilization: 70  # Good balance
```

-   Too low (30%): Over-provisioning, high cost
-   Too high (90%): Slow response to spikes, rejections

**3\. Adjust stabilization windows based on workload**

For bursty inference workloads:

```
behavior:  scaleUp:    stabilizationWindowSeconds: 0      # Respond immediately to spikes  scaleDown:    stabilizationWindowSeconds: 600    # Wait 10 minutes before scaling down
```

For steady-state services:

```
behavior:  scaleUp:    stabilizationWindowSeconds: 60     # Wait 1 minute before scaling up  scaleDown:    stabilizationWindowSeconds: 300    # Wait 5 minutes before scaling down
```

**4\. Monitor scaling events**

```
kubectl describe hpa agent-scaler
```

**Output** (relevant section):

```
Events:  Type    Reason             Age   Message  ----    ------             ---   -------  Normal  SuccessfulRescale  2m    New size: 4; reason: cpu resource utilization (percentage of request) above target  Normal  SuccessfulRescale  1m    New size: 6; reason: cpu resource utilization (percentage of request) above target  Normal  SuccessfulRescale  30s   New size: 2; reason: All metrics below target
```

Events show every scaling decision and why it was made. Use this to verify HPA is responding correctly.

* * *

## Troubleshooting HPA

**Problem**: HPA shows `<unknown>` for TARGETS

```
kubectl get hpa
```

**Output**:

```
NAME           REFERENCE           TARGETS         MINPODS   MAXPODS   REPLICASagent-scaler   Deployment/my-agent <unknown>/50%   2         10        2
```

**Causes**:

1.  Metrics-server not running
2.  Pods haven't been running long enough for metrics to accumulate
3.  Deployment doesn't exist or is in wrong namespace

**Fix**:

```
# Verify metrics-serverkubectl get deployment metrics-server -n kube-system# Wait 1-2 minutes for metrics to accumulatekubectl top pods# Verify Deployment existskubectl get deployment my-agent
```

**Problem**: HPA not scaling despite high CPU

```
kubectl describe hpa agent-scaler
```

**Output**:

```
Current Metrics:   <some value>Desired Replicas:  10Min/Max Replicas:  2/10Status:            "Waiting for deployment..."
```

**Cause**: HPA calculated it should scale to 10, but Deployment can't create Pods fast enough.

**Fix**:

-   Check if nodes have capacity: `kubectl top nodes`
-   Check Pod events: `kubectl describe pod <pod-name>`
-   Increase resource limits in Deployment if Pods are OOMKilled

* * *

## Cleanup

When done experimenting:

```
kubectl delete hpa agent-scalerkubectl delete deployment my-agent
```

**Output**:

```
horizontalpodautoscaler.autoscaling "agent-scaler" deleteddeployment.apps "my-agent" deleted
```

* * *

## Try With AI

You now understand how HPA scales based on CPU. Real-world systems often need more sophisticated scaling based on **custom metrics** — things like queue depth, inference latency, or model confidence scores.

**Setup**: You're deploying an agent that processes inference requests from a queue. Load varies wildly: sometimes empty, sometimes 100 requests queued.

Your challenge: Design an HPA configuration that scales based on **queue depth** (a custom metric) instead of CPU.

**Your Assignment**:

1.  **Research custom metrics**
    
    Ask AI: "How do I configure Kubernetes HPA to scale based on custom metrics like queue depth? What components are needed beyond the standard metrics-server?"
    
2.  **Design the configuration**
    
    Based on AI's explanation, design an HPA manifest that:
    
    -   Scales a deployment based on queue depth
    -   Scales to 10 replicas if queue has 50+ items
    -   Scales down to 2 if queue is empty
    -   Has a 1-minute stabilization window for scale-down
    
    Ask AI: "Here's my desired scaling behavior: \[describe above\]. Write an HPA manifest that achieves this using custom metrics."
    
3.  **Understand the components**
    
    Ask AI: "In a custom metrics setup, what's the relationship between Prometheus, custom-metrics-api, and HPA? How does the data flow?"
    
4.  **Iterate on thresholds**
    
    Discuss with AI: "If an agent takes 30 seconds to process one request, and I want maximum 2-second response time, what queue depth should trigger scaling to 10?"
    
    Work through the math together:
    
    -   Expected throughput: 1 request / 30 seconds = 2 requests/minute per Pod
    -   With 10 Pods: 20 requests/minute
    -   Queue depth to maintain 2-second latency: (20 requests/min) × (2 seconds) / 60 = 0.67 requests
    
    Refine your threshold based on this analysis.
    

**Expected outcome**: You'll understand that CPU-based scaling is simple but crude. Custom metrics enable precise control over system behavior. You don't scale "when CPU is high"—you scale "when queue depth exceeds healthy levels."

* * *

## Reflect on Your Skill

You built a `kubernetes-deployment` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my kubernetes-deployment skill, create an HPA that scales based on CPU utilization.Does my skill generate HPA manifests with minReplicas, maxReplicas, and target metrics?
```

### Identify Gaps

Ask yourself:

-   Did my skill include metrics-server as a prerequisite for HPA functionality?
-   Did it explain scaling behavior (scaleUp vs scaleDown stabilization windows)?
-   Did it cover the scaling calculation formula (desired = current × current\_usage / target)?
-   Did it include best practices for target utilization (50-80%) and stabilization windows?

### Improve Your Skill

If you found gaps:

```
My kubernetes-deployment skill is missing HPA configuration and scaling behavior details.Update it to include metrics-server verification, stabilization window configuration, and custom metrics patterns for AI workloads.
```

* * *

Checking access...

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 50: Kubernetes for AI Services](/docs/AI-Cloud-Native-Development/kubernetes-for-ai-services)
-   RBAC: Securing Your Agent Deployments

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/50-kubernetes-for-ai-services/10-rbac-securing-agent-deployments.md)

# RBAC: Securing Your Agent Deployments

In Lesson 4, you deployed a Kubernetes Pod with a containerized agent. By default, that Pod can read any ConfigMap, access any Secret, create Pods, delete Deployments—anything in the cluster. This is a security disaster. If an attacker compromises your agent container, they inherit all those permissions and can pivot through your entire cluster.

Role-Based Access Control (RBAC) solves this by restricting what your agent can do. Instead of giving your agent all permissions, you define exactly which Kubernetes resources it needs to access and which verbs (actions) it can perform on those resources. Your agent can read the ConfigMap it needs but cannot delete Deployments. Another agent can list Pods but cannot create Secrets. This is the principle of least privilege: each workload gets only the permissions it needs, nothing more.

* * *

## Security Requirement: Agent Access Control

Before configuring RBAC, define what your agent needs:

**Specification:**

-   Agent must read ConfigMap "agent-config" in the same namespace
-   Agent must read Secret "api-credentials" in the same namespace only (not across namespaces)
-   Agent must NOT create, delete, or modify any Kubernetes resources
-   Agent must NOT access secrets or configmaps in other namespaces
-   Cluster administrator must audit what permissions the agent has

**Why this matters:** A compromised agent cannot become a stepping stone to cluster-wide compromise.

* * *

## RBAC Components

RBAC consists of five components. Understanding how they connect is critical:

```
┌─────────────────────────────────────────────────────────────┐│                    RBAC Architecture                         │├─────────────────────────────────────────────────────────────┤│                                                              ││  ServiceAccount (Identity)                                   ││  ├─ apiVersion: v1                                          ││  ├─ kind: ServiceAccount                                    ││  └─ metadata.name: "agent-sa"                               ││                    ↓                                         ││  RoleBinding (Connection)                                    ││  ├─ roleRef → Role                                          ││  ├─ subjects → [ServiceAccount]                             ││  └─ metadata.namespace: "default"                           ││                    ↓                                         ││  Role (Permissions in namespace)                             ││  ├─ apiVersion: rbac.authorization.k8s.io/v1                ││  ├─ kind: Role                                              ││  ├─ rules[].resources: ["configmaps", "secrets"]            ││  ├─ rules[].verbs: ["get", "list"]                          ││  └─ metadata.namespace: "default"                           ││                    ↓                                         ││  Resources (What to access)                                  ││  └─ ConfigMaps, Secrets, Pods, Deployments...               ││                                                              ││  Note: ClusterRole/ClusterRoleBinding for cluster-wide      ││  permissions (same structure, cluster scope)                ││                                                              │└─────────────────────────────────────────────────────────────┘
```

**The five components:**

1.  **ServiceAccount** - An identity for Pods in a namespace. When your Pod starts, Kubernetes mounts the ServiceAccount's token as a credential file (`/var/run/secrets/kubernetes.io/serviceaccount/token`). This token proves "I am this ServiceAccount."
    
2.  **Role** - A set of permissions (rules) within a namespace. Each rule specifies:
    
    -   `resources`: What Kubernetes objects (configmaps, secrets, pods, deployments)
    -   `verbs`: What actions (get, list, create, delete, update, patch, watch)
    -   `apiGroups`: Which API group (core api: "", apps: "apps", batch: "batch")
3.  **RoleBinding** - Connects a ServiceAccount to a Role within a namespace. "This ServiceAccount gets these permissions."
    
4.  **ClusterRole** - A set of permissions cluster-wide. Same structure as Role, but applies to all namespaces.
    
5.  **ClusterRoleBinding** - Connects a ServiceAccount to a ClusterRole cluster-wide.
    

* * *

## Creating a ServiceAccount

A ServiceAccount is your Pod's identity. When your Pod makes a request to the Kubernetes API, it presents its ServiceAccount token.

```
kubectl create serviceaccount agent-sa
```

**Output:**

```
serviceaccount/agent-sa created
```

Verify it was created:

```
kubectl get serviceaccount agent-sa -o yaml
```

**Output:**

```
apiVersion: v1kind: ServiceAccountmetadata:  creationTimestamp: "2025-01-15T14:23:45Z"  name: agent-sa  namespace: default  resourceVersion: "12345"  uid: abc-def-ghisecrets:- name: agent-sa-token-xyz789
```

Notice Kubernetes automatically created a token secret (`agent-sa-token-xyz789`). This token is what your Pod will use when making API requests.

* * *

## Defining a Role with Minimal Permissions

A Role specifies what actions are allowed. For your agent, it only needs to read ConfigMaps and Secrets:

```
apiVersion: rbac.authorization.k8s.io/v1kind: Rolemetadata:  name: agent-reader  namespace: defaultrules:- apiGroups: [""]  # core API group (ConfigMaps, Secrets are here)  resources: ["configmaps", "secrets"]  verbs: ["get", "list"]
```

Save this as `agent-role.yaml` and apply it:

```
kubectl apply -f agent-role.yaml
```

**Output:**

```
role.rbac.authorization.k8s.io/agent-reader created
```

Verify the Role was created:

```
kubectl get role agent-reader -o yaml
```

**Output:**

```
apiVersion: rbac.authorization.k8s.io/v1kind: Rolemetadata:  creationTimestamp: "2025-01-15T14:24:10Z"  name: agent-reader  namespace: default  resourceVersion: "12356"  uid: xyz-abc-defrules:- apiGroups:  - ""  resources:  - configmaps  - secrets  verbs:  - get  - list
```

**Understanding the Rule:**

-   `apiGroups: [""]` - Empty string means the core API group. ConfigMaps and Secrets live here.
-   `resources: ["configmaps", "secrets"]` - The agent can access ConfigMaps and Secrets.
-   `verbs: ["get", "list"]` - The agent can GET a specific configmap (`get`) and LIST all configmaps (`list`). It cannot create, delete, update, or patch.

* * *

## Binding the Role to the ServiceAccount

A Role defines permissions, but it's not assigned to anyone yet. A RoleBinding connects the ServiceAccount (your agent's identity) to the Role (the permissions):

```
apiVersion: rbac.authorization.k8s.io/v1kind: RoleBindingmetadata:  name: agent-reader-binding  namespace: defaultroleRef:  apiGroup: rbac.authorization.k8s.io  kind: Role  name: agent-readersubjects:- kind: ServiceAccount  name: agent-sa  namespace: default
```

Save this as `agent-rolebinding.yaml` and apply it:

```
kubectl apply -f agent-rolebinding.yaml
```

**Output:**

```
rolebinding.rbac.authorization.k8s.io/agent-reader-binding created
```

Verify the RoleBinding was created:

```
kubectl get rolebinding agent-reader-binding -o yaml
```

**Output:**

```
apiVersion: rbac.authorization.k8s.io/v1kind: RoleBindingmetadata:  creationTimestamp: "2025-01-15T14:24:45Z"  name: agent-reader-binding  namespace: default  resourceVersion: "12357"roleRef:  apiGroup: rbac.authorization.k8s.io  kind: Role  name: agent-readersubjects:- kind: ServiceAccount  name: agent-sa  namespace: default
```

**What happened:** The RoleBinding now says "ServiceAccount agent-sa in namespace default gets the permissions from Role agent-reader in namespace default."

* * *

## Assigning ServiceAccount to Your Pod

Your Pod must explicitly use the ServiceAccount you created. When you create a Pod without specifying a serviceAccountName, it uses the default ServiceAccount, which has no permissions. To use your agent-sa:

```
apiVersion: v1kind: Podmetadata:  name: agent-pod  namespace: defaultspec:  serviceAccountName: agent-sa  # Use the agent-sa ServiceAccount  containers:  - name: agent    image: my-agent:latest    env:    - name: CONFIG_MAP_NAME      value: agent-config    - name: SECRET_NAME      value: api-credentials
```

When this Pod starts, Kubernetes mounts the agent-sa token into the container at `/var/run/secrets/kubernetes.io/serviceaccount/token`. Your agent can then use this token to authenticate API requests.

Apply the Pod:

```
kubectl apply -f agent-pod.yaml
```

**Output:**

```
pod/agent-pod created
```

* * *

## Auditing Permissions with kubectl auth can-i

How do you verify your agent actually has the permissions you defined? Use `kubectl auth can-i`:

```
kubectl auth can-i get configmaps --as=system:serviceaccount:default:agent-sa
```

**Output:**

```
yes
```

The agent can get configmaps. Now test if it can delete deployments (it shouldn't):

```
kubectl auth can-i delete deployments --as=system:serviceaccount:default:agent-sa
```

**Output:**

```
no
```

Correct. The agent cannot delete deployments because the agent-reader Role doesn't include the delete verb for deployments.

Test accessing secrets:

```
kubectl auth can-i get secrets --as=system:serviceaccount:default:agent-sa
```

**Output:**

```
yes
```

Test creating pods (it shouldn't):

```
kubectl auth can-i create pods --as=system:serviceaccount:default:agent-sa
```

**Output:**

```
no
```

Good—the agent is restricted. It can only get and list configmaps and secrets, nothing else.

* * *

## Principle of Least Privilege

The approach above demonstrates least privilege: the agent gets exactly the permissions it needs and nothing more. Compare two scenarios:

**Anti-pattern (BAD):**

```
kubectl create clusterrolebinding agent-admin \  --clusterrole=cluster-admin \  --serviceaccount=default:agent-sa
```

This gives your agent admin permissions across the entire cluster. If the agent is compromised, the attacker has full cluster access. **Never do this in production.**

**Best practice (GOOD):**

```
rules:- apiGroups: [""]  resources: ["configmaps", "secrets"]  verbs: ["get", "list"]  # Additional limit: restrict to specific resource names  resourceNames: ["agent-config", "api-credentials"]
```

This restricts the agent to only the two configmaps/secrets it needs by name. If the agent requests a different secret, Kubernetes denies it.

* * *

## Try With AI

**Setup:** You're designing RBAC for a multi-tenant AI deployment. Multiple agents run in the same cluster but in different namespaces:

-   Namespace "agents-team-a": Agent needs ConfigMap "config-a" and Secret "creds-a" (team-a namespace only)
-   Namespace "agents-team-b": Agent needs ConfigMap "config-b" and Secret "creds-b" (team-b namespace only)
-   Both agents need to read the Deployment object to check the current replica count (list, get verbs only)

**Task 1: Design the RBAC structure**

Ask AI: "Design RBAC for a multi-tenant Kubernetes deployment. I have two teams, each in their own namespace. Each team's agent needs:

1.  Read-only access to its own namespace's ConfigMap and Secret (by name: config-a/config-b and creds-a/creds-b)
2.  Ability to list and get Deployments in its own namespace only
3.  No cross-namespace access

I want each agent's permissions isolated so a compromised agent cannot access another team's data. Show me the ServiceAccount, Role, and RoleBinding YAML for team-a. How would team-b's setup differ?"

**Task 2: Audit the permissions**

Ask AI: "After applying the RBAC, how would I use kubectl auth can-i to verify that the team-a agent can:

-   Get its own ConfigMap but not team-b's?
-   Get Deployments but not create Deployments?
-   Not access secrets in other namespaces?

Show me the exact kubectl commands and expected outputs."

**Task 3: Refine for production**

Ask AI: "What additional RBAC considerations should I include for production? Should I use more granular resource restrictions, API groups, or non-resource URLs? Show me an enhanced Role that adds read-only access to Pod logs and metrics."

* * *

**Expected Outcomes:**

-   You understand how ServiceAccounts, Roles, and RoleBindings compose to restrict permissions
-   You can design RBAC that enforces least privilege across namespaces
-   You can audit what an agent can and cannot do using kubectl auth can-i
-   You recognize that over-permissioning is a common security anti-pattern

* * *

## Reflect on Your Skill

You built a `kubernetes-deployment` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my kubernetes-deployment skill, create RBAC configuration for a Pod.Does my skill generate ServiceAccount, Role, and RoleBinding with minimal required permissions?
```

### Identify Gaps

Ask yourself:

-   Did my skill include the principle of least privilege (only necessary permissions)?
-   Did it explain the RBAC component hierarchy (ServiceAccount → RoleBinding → Role → Resources)?
-   Did it cover kubectl auth can-i for auditing permissions?
-   Did it distinguish between Role/RoleBinding (namespace-scoped) and ClusterRole/ClusterRoleBinding (cluster-scoped)?

### Improve Your Skill

If you found gaps:

```
My kubernetes-deployment skill is missing RBAC security patterns and permission auditing.Update it to include ServiceAccount creation, Role definition with minimal permissions, RoleBinding configuration, and kubectl auth can-i verification.
```

* * *

Checking access...

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 50: Kubernetes for AI Services](/docs/AI-Cloud-Native-Development/kubernetes-for-ai-services)
-   Health Checks: Liveness, Readiness, Startup Probes

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/50-kubernetes-for-ai-services/11-health-checks-probes.md)

# Health Checks: Liveness, Readiness, Startup Probes

Your agent is now running in a Deployment (Lesson 4). Kubernetes monitors it and restarts it if the container crashes. But there's a critical problem: **a container that's running might not be healthy**.

Imagine this: Your agent's model loads asynchronously. For the first 30 seconds after startup, the container is running but can't handle requests. Kubernetes sees it as "ready" and sends traffic to it immediately. Users get errors. The container didn't crash, so Kubernetes doesn't restart it. Your service is degraded but technically "up."

This lesson teaches health checks—the mechanism that lets Kubernetes know whether your container is actually ready to serve traffic, whether it's still alive, and how long to wait during startup before expecting it to respond.

* * *

## The Problem: Running ≠ Ready

Consider your AI agent startup sequence:

```
0s   - Container starts, main process begins0.5s - Python initializes, imports libraries5s   - Model weights load into memory10s  - Embedding vectors cache builds30s  - Application ready to serve requests
```

**Without health checks:**

-   Kubernetes sends traffic at 1s (while model is still loading)
-   Requests fail, users see errors
-   Container doesn't crash (exit code 0 is still valid)
-   Kubernetes doesn't restart it
-   You have a running but broken service

**With health checks:**

-   Readiness probe fails for first 30 seconds (container is running but not ready)
-   Kubernetes removes pod from service endpoints
-   Traffic doesn't reach it until model is loaded
-   Once ready, traffic flows
-   If it becomes unhealthy, Kubernetes routes around it or restarts it

* * *

## Three Types of Probes

Kubernetes provides three health check mechanisms:

### 1\. Readiness Probe (Is this pod ready to serve traffic?)

**Purpose**: Determines if a pod should receive traffic from Services.

**When to use**:

-   Application startup is slow (models loading, caches building)
-   Container is running but dependencies aren't ready
-   Need to temporarily remove pod from load balancer during updates

**Behavior**:

-   Fails → Pod removed from Service endpoints (traffic stops)
-   Recovers → Pod re-added to Service endpoints (traffic resumes)
-   Success → Pod receives traffic normally

**Key insight**: Readiness probes are about external traffic. Even a healthy, running pod might not be ready to serve external requests.

### 2\. Liveness Probe (Is this pod still alive?)

**Purpose**: Detects if container is in a broken/stuck state and needs restart.

**When to use**:

-   Detect deadlocks or infinite loops
-   Identify containers that are running but unresponsive
-   Force restart of unhealthy containers (different from crash)

**Behavior**:

-   Fails continuously → Kubernetes restarts pod
-   Success → No action, pod continues running

**Key insight**: Liveness probes are about pod lifecycle. A pod can be running but logically dead (stuck waiting, infinite loop, memory leak).

### 3\. Startup Probe (Has this pod finished initializing?)

**Purpose**: Prevents liveness/readiness probes from triggering during slow startup.

**When to use**:

-   Container has long initialization time (30+ seconds)
-   Need different probe behavior during startup vs steady state
-   AI agents loading models, warming caches

**Behavior**:

-   Fails during startup → No restart (give it more time)
-   Succeeds → Liveness/readiness probes take over
-   Fails after startup complete → Kubernetes restarts pod (treated as liveness failure)

**Key insight**: Startup probes buy time for initialization. Once startup succeeds, other probes begin their work.

* * *

## HTTP GET Probes (Most Common)

HTTP probes call a health endpoint and check the response code.

### Basic HTTP Probe Structure

```
spec:  containers:  - name: agent    image: my-agent:v1    ports:    - containerPort: 8000    readinessProbe:      httpGet:        path: /health/ready        port: 8000      initialDelaySeconds: 10      periodSeconds: 5      timeoutSeconds: 1      failureThreshold: 3
```

**Explanation**:

-   `httpGet.path`: Endpoint to call
-   `httpGet.port`: Container port (can be number or name)
-   `initialDelaySeconds`: Wait 10s before first probe (let container start)
-   `periodSeconds`: Check every 5 seconds
-   `timeoutSeconds`: If response takes >1s, count as failure
-   `failureThreshold`: After 3 failures, take action (remove from service or restart)

### HTTP Readiness Probe Example

Your FastAPI agent needs a readiness endpoint that returns 200 only when model is loaded:

```
# main.py - FastAPI agent with readiness endpointfrom fastapi import FastAPIfrom fastapi.responses import JSONResponseimport asyncioimport timeapp = FastAPI()# Simulate model loading timemodel_loaded = Falseload_start = None@app.on_event("startup")async def load_model():    global model_loaded, load_start    load_start = time.time()    print("Starting model load...")    # Simulate 15s model loading    await asyncio.sleep(15)    model_loaded = True    load_time = time.time() - load_start    print(f"Model loaded in {load_time:.1f}s")@app.get("/health/ready")async def readiness():    """Returns 200 only when model is fully loaded"""    if not model_loaded:        return JSONResponse(            {"status": "loading", "ready": False},            status_code=503        )    return JSONResponse({"status": "ready", "ready": True})@app.get("/health/live")async def liveness():    """Always returns 200 if main process is running"""    return JSONResponse({"status": "alive"})@app.post("/predict")async def predict(data: dict):    """Agent inference endpoint"""    if not model_loaded:        return JSONResponse(            {"error": "Model still loading, try again soon"},            status_code=503        )    # Do actual inference    return {"prediction": "example output"}
```

**Output** (when you test these endpoints):

```
Starting model load...
```

```
# First request during loadingcurl http://localhost:8000/health/ready
```

**Output:**

```
{"status": "loading", "ready": false}
```

```
# After 15 seconds, try againcurl http://localhost:8000/health/ready
```

**Output:**

```
{"status": "ready", "ready": true}
```

```
# Liveness endpoint always respondscurl http://localhost:8000/health/live
```

**Output:**

```
{"status": "alive"}
```

### Deployment with HTTP Readiness and Liveness Probes

```
apiVersion: apps/v1kind: Deploymentmetadata:  name: agent-deploymentspec:  replicas: 2  selector:    matchLabels:      app: agent  template:    metadata:      labels:        app: agent    spec:      containers:      - name: agent        image: my-agent:v1        ports:        - containerPort: 8000          name: http        # Wait for model to load before sending traffic        readinessProbe:          httpGet:            path: /health/ready            port: http          initialDelaySeconds: 5    # Check after 5s (model loads in 15s)          periodSeconds: 5          # Check every 5s          timeoutSeconds: 2         # Request must complete in 2s          failureThreshold: 2       # 2 failures = not ready (10s total)        # Detect if container is stuck or crashed        livenessProbe:          httpGet:            path: /health/live            port: http          initialDelaySeconds: 20   # Wait for startup before checking          periodSeconds: 10         # Check every 10s (less frequent)          timeoutSeconds: 2          failureThreshold: 3       # 3 failures = restart pod (30s total)        # Buy time for initialization before liveness checks        startupProbe:          httpGet:            path: /health/ready            port: http          periodSeconds: 5          # Check every 5s during startup          failureThreshold: 6       # Allow 30s for startup (6 * 5s)
```

**What happens when you deploy this:**

```
kubectl apply -f deployment.yaml
```

**Output:**

```
deployment.apps/agent-deployment created# Watch pod startupkubectl get pods -wNAME                                 READY   STATUS    RESTARTSagent-deployment-7d4f5c6b9f-abc123   0/1     Running   0agent-deployment-7d4f5c6b9f-xyz789   0/1     Running   0# Startup probe running (checking every 5s)# At 5s: startup probe fails (model still loading)# At 10s: startup probe fails# At 15s: startup probe succeeds (model loaded)## Now readiness and liveness probes take over# After ~20s:agent-deployment-7d4f5c6b9f-abc123   1/1     Running   0agent-deployment-7d4f5c6b9f-xyz789   1/1     Running   0# View probe eventskubectl describe pod agent-deployment-7d4f5c6b9f-abc123# Output excerpt:# Events:#   Type     Reason     Age   From               Message#   ----     ------     ---   ----               -------#   Normal   Created    45s   kubelet            Created container agent#   Normal   Started    45s   kubelet            Started container agent#   Warning  Unhealthy  40s   kubelet            Readiness probe failed: HTTP probe failed#   Warning  Unhealthy  35s   kubelet            Readiness probe failed: HTTP probe failed#   Normal   Ready      30s   kubelet            Container is ready
```

* * *

## TCP Socket Probes (Port Availability)

Use TCP probes when you don't have an HTTP endpoint, or for protocols like gRPC/database connections.

### TCP Probe Configuration

```
spec:  containers:  - name: cache    image: redis:7    ports:    - containerPort: 6379    livenessProbe:      tcpSocket:        port: 6379      initialDelaySeconds: 10      periodSeconds: 10      timeoutSeconds: 1      failureThreshold: 3
```

**How it works**:

-   Kubernetes attempts TCP connection to port
-   Success → Port is open and accepting connections
-   Timeout/failure → Port not responding

**Example**: Redis cache in your cluster

```
# Redis container starts but is slow to open portkubectl logs deployment/redis-deployment# Output:Ready to accept connections
```

**kubectl describe** shows probe activity:

```
kubectl describe pod redis-deployment-xxxxx# Output excerpt:# Conditions:#   Ready          True#   ContainersReady True# Events:#   Type    Reason     Age  From     Message#   ----    ------     ---  ----     -------#   Normal  Created    1m   kubelet  Created container cache#   Normal  Started    1m   kubelet  Started container cache#   Normal  Healthy    55s  kubelet  Tcp-socket probe succeeded
```

* * *

## Exec Probes (Custom Commands)

Run arbitrary shell commands for custom health checks.

### Exec Probe Example

Your agent needs a complex health check:

```
spec:  containers:  - name: agent    image: my-agent:v1    readinessProbe:      exec:        command:        - /bin/sh        - -c        - |          # Check if critical files exist and are recent          [ -f /app/model.pkl ] && \          [ $(find /app/model.pkl -mmin -2) ] && \          curl -sf http://localhost:8000/health/ready > /dev/null      initialDelaySeconds: 5      periodSeconds: 10      timeoutSeconds: 5      failureThreshold: 2
```

**Explanation**:

-   `exec.command`: Run shell commands
-   First part: Verify model file exists and was modified in last 2 minutes
-   Second part: Verify HTTP endpoint responds
-   Exit code 0 = healthy, non-zero = unhealthy

### Example with Database Check

```
livenessProbe:  exec:    command:    - python    - -c    - |      import sqlite3      conn = sqlite3.connect('/data/cache.db')      cursor = conn.cursor()      cursor.execute('SELECT 1')      cursor.close()      print('Database healthy')
```

**Output** when you check the pod:

```
kubectl logs agent-deployment-xxxxx -c agent# Output:Database healthyDatabase healthyDatabase healthy# If it fails:kubectl describe pod agent-deployment-xxxxx# Output excerpt:# Events:#   Type     Reason     Age   Message#   ----     ------     ---   -------#   Warning  Unhealthy  30s   Exec probe failed: Database connection failed
```

* * *

## Timing Parameters (Critical Decisions)

Probe timing parameters dramatically affect pod lifecycle. Choosing wrong values causes cascading failures.

### initialDelaySeconds: Wait Before First Check

**Purpose**: Give container time to start before first health check.

**Decision framework**:

-   **Fast startup** (web server): 5-10s
-   **Moderate startup** (cache warming): 15-30s
-   **Slow startup** (model loading): 30-60s
-   **Very slow startup** (fine-tuning, large models): Use `startupProbe` instead

**Wrong value too low (5s for 15s load time)**:

```
0s   Container starts5s   First readiness probe → FAILS (model still loading)15s  Model finished loading20s  Readiness probe finally succeeds→ Pod unavailable for 15s unnecessarily
```

**Right value (25s for 15s load time)**:

```
0s   Container starts5s   Startup probe checking15s  Model loaded20s  Startup probe succeeds25s  First readiness check (succeeds)→ Cleaner transition
```

### periodSeconds: How Often to Check

**Purpose**: Frequency of health checks after first check.

**Decision framework**:

-   **Readiness probe**: 5-10s (frequent, pod removal is gentle)
-   **Liveness probe**: 10-30s (less frequent, restart is drastic)
-   **Startup probe**: 5s (frequent during init, then liveness takes over)

**Why different frequencies?**

-   Readiness: Removing pod from service is non-destructive
-   Liveness: Restarting pod loses in-flight requests

### timeoutSeconds: Wait for Response

**Purpose**: How long before probe response is considered failure.

**Decision framework**:

-   **Healthy endpoint**: 1-2s
-   **Slow endpoint**: 5s
-   **Database query**: 5-10s

**Watch out**: If timeout >= period, you get overlapping probes.

```
Wrong: periodSeconds: 5, timeoutSeconds: 10→ Probe takes 10s to timeout, but next probe starts at 5s→ Multiple overlapping probes, confusionRight: periodSeconds: 5, timeoutSeconds: 2→ Probe completes in 2s, next starts at 5s, clean
```

### failureThreshold: How Many Failures Until Action

**Purpose**: Prevent flaky endpoints from triggering cascading restarts.

**Decision framework**:

-   **Readiness probe**: 2-3 (quicker reaction to real issues)
-   **Liveness probe**: 3-5 (more tolerant, restart is drastic)
-   **Startup probe**: 6-10 (allow slow initialization)

**Math example**:

```
readiness: periodSeconds=5, failureThreshold=3→ 3 failed checks * 5s = 15s total before pod removedliveness: periodSeconds=10, failureThreshold=3→ 3 failed checks * 10s = 30s total before restartstartup: periodSeconds=5, failureThreshold=6→ 6 failed checks * 5s = 30s allowed for initialization
```

* * *

## Debugging Probe Failures

When pods aren't becoming ready or are restarting, probes are usually the culprit.

### Step 1: Check Pod Status

```
kubectl get pods
```

**Output:**

```
NAME                                 READY   STATUS    RESTARTSagent-deployment-7d4f5c6b9f-abc123   0/1     Running   0
```

**Interpretation**:

-   READY 0/1 = Pod running but not ready (readiness probe failing)
-   RESTARTS increasing = Liveness probe killing pod

### Step 2: Describe Pod for Events

```
kubectl describe pod agent-deployment-7d4f5c6b9f-abc123
```

**Output** (showing readiness probe failure):

```
Name:           agent-deployment-7d4f5c6b9f-abc123Namespace:      defaultStatus:         RunningContainers:  agent:    Image:      my-agent:v1    State:      Running      Started:  Sat, 22 Dec 2024 15:42:30 UTC    Ready:      False    Restart Count: 0    Readiness:  exec Exec probe failedEvents:  Type     Reason     Age    From               Message  ----     ------     ---    ----               -------  Normal   Created    2m18s  kubelet            Created container agent  Normal   Started    2m18s  kubelet            Started container agent  Warning  Unhealthy  2m13s  kubelet            Readiness probe failed: exec probe failed  Warning  Unhealthy  2m08s  kubelet            Readiness probe failed: exec probe failed  Warning  Unhealthy  2m03s  kubelet            Readiness probe failed: exec probe failed
```

**Key info**:

-   `Ready: False` = Readiness probe failing
-   `Readiness: exec Exec probe failed` = Which probe is failing
-   Events show exact failure messages

### Step 3: Check Container Logs

```
kubectl logs agent-deployment-7d4f5c6b9f-abc123# Output:Starting model load...Model loaded in 15.2sWARNING: POST /predict called before startup complete
```

**Diagnosis**: Model takes 15s to load, but readiness probe starts checking at 5s.

### Step 4: Test Probe Manually

Port forward to test endpoint directly:

```
kubectl port-forward pod/agent-deployment-7d4f5c6b9f-abc123 8000:8000
```

**Output:**

```
Forwarding from 127.0.0.1:8000 -> 8000Forwarding from [::1]:8000 -> 8000
```

In another terminal, test the readiness endpoint:

```
curl http://localhost:8000/health/ready
```

**Output** (if model is still loading):

```
{"error": "Model still loading"}
```

**Output** (if model is ready):

```
{"status": "ready", "ready": true}
```

### Step 5: Fix and Retest

Common fixes:

```
# Problem: initialDelaySeconds too low# Fix: Increase delayreadinessProbe:  httpGet:    path: /health/ready    port: 8000  initialDelaySeconds: 30  # Was 5, now 30# Problem: Endpoint too slow# Fix: Increase timeout  timeoutSeconds: 5  # Was 1# Problem: Flaky endpoint# Fix: Increase failureThreshold  failureThreshold: 3  # Was 1
```

Apply updated deployment:

```
kubectl apply -f deployment.yaml# Watch pods restart with new configkubectl get pods -wNAME                                 READY   STATUS     RESTARTSagent-deployment-7d4f5c6b9f-abc123   0/1     Pending    0agent-deployment-7d4f5c6b9f-abc123   0/1     Running    0agent-deployment-7d4f5c6b9f-abc123   1/1     Running    0# Now ready!
```

* * *

## AI-Native Health Checks

For AI agents with variable startup times and complex dependencies, design probes thoughtfully.

### Pattern: Startup Probe + Readiness Probe + Liveness Probe

```
apiVersion: apps/v1kind: Deploymentmetadata:  name: ai-agentspec:  replicas: 3  template:    spec:      containers:      - name: agent        image: my-agent:latest        # Buy time for model initialization        startupProbe:          httpGet:            path: /health/startup            port: 8000          periodSeconds: 5          failureThreshold: 30  # 150s total (5 * 30)        # Check if model is loaded and ready        readinessProbe:          httpGet:            path: /health/ready            port: 8000          initialDelaySeconds: 5          periodSeconds: 5          timeoutSeconds: 2          failureThreshold: 2        # Detect if model inference is broken        livenessProbe:          httpGet:            path: /health/live            port: 8000          initialDelaySeconds: 30          periodSeconds: 10          timeoutSeconds: 2          failureThreshold: 3
```

### Probe Implementation Strategy

```
# health.py - Health check endpoints for AI agentfrom fastapi import FastAPIfrom datetime import datetimeimport os# Global statemodel = Nonemodel_loaded_at = Nonelast_inference_at = Nonelast_inference_error = None@app.on_event("startup")async def initialize_agent():    global model, model_loaded_at, last_inference_at    print("Loading model...")    # Simulate loading process    await asyncio.sleep(30)  # Real: model.load(), cache.warm()    model = True    model_loaded_at = datetime.now()    last_inference_at = datetime.now()@app.get("/health/startup")async def startup():    """Startup probe: Is initialization complete?"""    if model is None:        return JSONResponse({"status": "initializing"}, status_code=503)    return JSONResponse({"status": "started"})@app.get("/health/ready")async def readiness():    """Readiness probe: Is this pod ready for traffic?"""    if model is None:        return JSONResponse({"status": "not_ready"}, status_code=503)    # Optional: Check dependencies    if not check_cache_healthy():        return JSONResponse({"status": "cache_unhealthy"}, status_code=503)    return JSONResponse(        {"status": "ready", "model_loaded_at": model_loaded_at.isoformat()}    )@app.get("/health/live")async def liveness():    """Liveness probe: Is inference still working?"""    if model is None:        return JSONResponse({"status": "not_initialized"}, status_code=503)    # Check for stuck state (no inference in 5 minutes)    if (datetime.now() - last_inference_at).total_seconds() > 300:        return JSONResponse(            {"status": "stale", "age_seconds": 300},            status_code=503        )    # Check for recent errors    if last_inference_error:        return JSONResponse(            {"status": "error", "last_error": last_inference_error},            status_code=503        )    return JSONResponse({"status": "healthy"})@app.post("/predict")async def predict(data: dict):    global last_inference_at, last_inference_error    try:        if model is None:            raise RuntimeError("Model not loaded")        result = run_inference(data)        last_inference_at = datetime.now()        last_inference_error = None        return result    except Exception as e:        last_inference_error = str(e)        return JSONResponse({"error": str(e)}, status_code=500)
```

* * *

## Try With AI

Now you've learned to configure probes manually. In the next lesson, you'll use kubectl-ai to generate probe configurations automatically and debug real cluster issues with AI guidance.

**Setup**: You have a containerized agent with a health endpoint.

**Challenge**: Configure probes for an agent with these characteristics:

-   Model loads in 20 seconds
-   Health endpoint responds in under 500ms when healthy
-   You want aggressive failure detection for readiness (pod removed quickly if unhealthy)
-   You want conservative failure detection for liveness (don't restart on transient errors)

**Action Prompt**: Write a Deployment manifest with startup, readiness, and liveness probes. Consider:

1.  How long should initialDelaySeconds be?
2.  How frequent should readiness checks be (periodSeconds)?
3.  How many failures before removing pod from service (failureThreshold)?
4.  What should failureThreshold be for liveness (more conservative)?

Test your configuration by deploying to your cluster and simulating failures (make your health endpoint return 500 temporarily to test probe behavior).

* * *

## Reflect on Your Skill

You built a `kubernetes-deployment` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my kubernetes-deployment skill, configure liveness, readiness, and startup probes.Does my skill generate proper probe configurations with appropriate timing parameters?
```

### Identify Gaps

Ask yourself:

-   Did my skill include the three probe types (liveness, readiness, startup) and when to use each?
-   Did it explain HTTP GET, TCP socket, and exec probe mechanisms?
-   Did it cover timing parameters (initialDelaySeconds, periodSeconds, timeoutSeconds, failureThreshold)?
-   Did it include debugging patterns for probe failures (describe pod, check logs, port-forward)?

### Improve Your Skill

If you found gaps:

```
My kubernetes-deployment skill is missing health probe configuration and debugging patterns.Update it to include all three probe types, appropriate timing for AI agents with slow initialization, and probe failure diagnosis steps.
```

* * *

Checking access...

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 50: Kubernetes for AI Services](/docs/AI-Cloud-Native-Development/kubernetes-for-ai-services)
-   Jobs and CronJobs: Batch Workloads for AI Agents

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/50-kubernetes-for-ai-services/12-jobs-and-cronjobs-batch-workloads.md)

# Jobs and CronJobs: Batch Workloads for AI Agents

Deployments keep your AI agent running forever. But what about tasks that should run once and stop? Or tasks that run on a schedule?

-   **Refresh vector embeddings** every night at 2 AM
-   **Clean up old conversation logs** weekly
-   **Run a one-time data migration** when you upgrade models
-   **Generate daily analytics reports** from agent interactions

These are **batch workloads**—finite tasks that complete and exit. Kubernetes provides two primitives for this: **Jobs** (run once) and **CronJobs** (run on a schedule).

* * *

## Long-Running vs. Finite Workloads

You've learned that Deployments manage Pods that should run continuously. But not all workloads are long-running:

```
Deployment (Long-Running):┌──────────────────────────────────────────────────────────┐│  Pod runs forever → crashes → restarts → runs forever   ││  Example: FastAPI agent serving requests 24/7           │└──────────────────────────────────────────────────────────┘Job (Finite):┌──────────────────────────────────────────────────────────┐│  Pod starts → does work → completes → stops             ││  Example: Refresh embeddings, exit when done            │└──────────────────────────────────────────────────────────┘CronJob (Scheduled Finite):┌──────────────────────────────────────────────────────────┐│  Every night at 2 AM: create Job → does work → stops    ││  Example: Nightly log cleanup                           │└──────────────────────────────────────────────────────────┘
```

**Key insight**: Deployments use `restartPolicy: Always`—Pods restart on completion. Jobs use `restartPolicy: Never` or `OnFailure`—Pods don't restart after successful completion.

* * *

## Your First Job: A One-Time Task

Create a Job that simulates an AI agent maintenance task—processing data and exiting:

### Job YAML Structure

```
apiVersion: batch/v1kind: Jobmetadata:  name: embedding-refreshspec:  template:    spec:      containers:      - name: refresh        image: python:3.11-slim        command: ["python", "-c"]        args:          - |            import time            print("Starting embedding refresh...")            for i in range(5):                print(f"Processing batch {i+1}/5...")                time.sleep(2)            print("Embedding refresh complete!")      restartPolicy: Never  backoffLimit: 4
```

**Output:** (This is the manifest structure; we'll apply it next)

### Understanding Each Field

**`apiVersion: batch/v1`** Jobs use the `batch` API group, not `apps` like Deployments.

**`kind: Job`** Tells Kubernetes this is a finite workload.

**`spec.template`** The Pod template—identical to what you'd put in a Deployment's template. The Job creates one or more Pods using this template.

**`restartPolicy: Never`** Critical difference from Deployments. When the container exits with code 0 (success), the Pod stays `Completed` and doesn't restart.

**`backoffLimit: 4`** If the container fails (non-zero exit code), Kubernetes retries up to 4 times before marking the Job as failed.

* * *

## Running and Monitoring the Job

Save the manifest as `embedding-refresh-job.yaml` and apply it:

```
kubectl apply -f embedding-refresh-job.yaml
```

**Output:**

```
job.batch/embedding-refresh created
```

Watch the Job progress:

```
kubectl get jobs -w
```

**Output:**

```
NAME                COMPLETIONS   DURATION   AGEembedding-refresh   0/1           3s         3sembedding-refresh   0/1           12s        12sembedding-refresh   1/1           12s        12s
```

Check the Pod status:

```
kubectl get pods
```

**Output:**

```
NAME                      READY   STATUS      RESTARTS   AGEembedding-refresh-7x9kq   0/1     Completed   0          45s
```

Notice **STATUS: Completed**—the Pod finished successfully and stopped. Unlike a Deployment Pod (which would show `Running`), this Pod is done.

View the logs to see what happened:

```
kubectl logs embedding-refresh-7x9kq
```

**Output:**

```
Starting embedding refresh...Processing batch 1/5...Processing batch 2/5...Processing batch 3/5...Processing batch 4/5...Processing batch 5/5...Embedding refresh complete!
```

The Job ran, completed its task, and stopped. The Pod remains in `Completed` state for inspection (logs, debugging) until you delete it.

* * *

## The Job → Pod Relationship

```
Job: embedding-refresh    ↓ creates and managesPod: embedding-refresh-7x9kq (status: Completed)
```

Unlike Deployments (which use ReplicaSets as intermediaries), Jobs directly manage their Pods. The naming follows the pattern: `{job-name}-{random-suffix}`.

Delete the Job (this also deletes its Pods):

```
kubectl delete job embedding-refresh
```

**Output:**

```
job.batch "embedding-refresh" deleted
```

* * *

## Parallel Jobs: Processing in Batches

What if you need to process 10,000 documents for embedding refresh? Running sequentially takes too long. Jobs support parallelism:

```
apiVersion: batch/v1kind: Jobmetadata:  name: batch-processorspec:  completions: 5      # Total tasks to complete  parallelism: 2      # Run 2 Pods at a time  template:    spec:      containers:      - name: processor        image: busybox:1.36        command: ["sh", "-c"]        args:          - |            echo "Processing task on $(hostname)..."            sleep 5            echo "Task complete!"      restartPolicy: Never
```

**Key parameters:**

Parameter

Value

Meaning

`completions`

5

The Job needs 5 successful Pod completions

`parallelism`

2

Run up to 2 Pods simultaneously

Apply and watch:

```
kubectl apply -f batch-processor.yamlkubectl get pods -w
```

**Output:**

```
NAME                    READY   STATUS    RESTARTS   AGEbatch-processor-abc12   1/1     Running   0          2sbatch-processor-def34   1/1     Running   0          2sbatch-processor-abc12   0/1     Completed 0          7sbatch-processor-ghi56   1/1     Running   0          1sbatch-processor-def34   0/1     Completed 0          8sbatch-processor-jkl78   1/1     Running   0          1s...
```

Kubernetes maintains 2 Pods running at any time until 5 completions are achieved.

Check Job status:

```
kubectl get jobs batch-processor
```

**Output:**

```
NAME              COMPLETIONS   DURATION   AGEbatch-processor   5/5           18s        25s
```

* * *

## Job Operation Types Summary

Type

completions

parallelism

Behavior

**Non-parallel**

1 (default)

1 (default)

Single Pod, single completion

**Parallel with fixed count**

N

M

Run M Pods at a time until N completions

**Work queue**

unset

M

Run M Pods, complete when any Pod succeeds and all terminate

For AI workloads, **parallel with fixed count** is most common—split a large dataset into chunks and process in parallel.

* * *

## CronJobs: Scheduled Batch Work

CronJobs create Jobs on a schedule. Every execution creates a new Job, which creates new Pod(s).

```
CronJob: nightly-cleanup (schedule: "0 2 * * *")    ↓ creates at 2:00 AMJob: nightly-cleanup-28473049    ↓ createsPod: nightly-cleanup-28473049-abc12 (status: Completed)
```

### Cron Expression Syntax

```
┌───────────── minute (0-59)│ ┌───────────── hour (0-23)│ │ ┌───────────── day of month (1-31)│ │ │ ┌───────────── month (1-12)│ │ │ │ ┌───────────── day of week (0-6, Sunday=0)│ │ │ │ │* * * * *
```

Common patterns:

Expression

Meaning

`0 2 * * *`

Every day at 2:00 AM

`*/15 * * * *`

Every 15 minutes

`0 0 * * 0`

Every Sunday at midnight

`0 6 1 * *`

First day of each month at 6:00 AM

### Creating a CronJob

Create a CronJob that cleans up old agent logs every minute (for demonstration—in production, use a longer schedule):

```
apiVersion: batch/v1kind: CronJobmetadata:  name: log-cleanupspec:  schedule: "* * * * *"    # Every minute (for demo)  jobTemplate:    spec:      template:        spec:          containers:          - name: cleanup            image: busybox:1.36            command: ["sh", "-c"]            args:              - |                echo "Running log cleanup at $(date)"                echo "Removing logs older than 7 days..."                echo "Cleanup complete!"          restartPolicy: OnFailure  successfulJobsHistoryLimit: 3  failedJobsHistoryLimit: 1
```

**New fields:**

**`schedule`** Cron expression defining when to create Jobs.

**`jobTemplate`** The Job template—notice it's the same structure as a Job spec, wrapped in `jobTemplate.spec`.

**`successfulJobsHistoryLimit: 3`** Keep the last 3 successful Jobs (and their Pods) for inspection. Older ones are auto-deleted.

**`failedJobsHistoryLimit: 1`** Keep only the last failed Job for debugging.

Apply and watch:

```
kubectl apply -f log-cleanup-cronjob.yamlkubectl get cronjobs
```

**Output:**

```
NAME          SCHEDULE    SUSPEND   ACTIVE   LAST SCHEDULE   AGElog-cleanup   * * * * *   False     0        <none>          10s
```

Wait a minute and check again:

```
kubectl get cronjobs
```

**Output:**

```
NAME          SCHEDULE    SUSPEND   ACTIVE   LAST SCHEDULE   AGElog-cleanup   * * * * *   False     0        45s             90s
```

List Jobs created by the CronJob:

```
kubectl get jobs
```

**Output:**

```
NAME                     COMPLETIONS   DURATION   AGElog-cleanup-28504821     1/1           3s         75slog-cleanup-28504822     1/1           2s         15s
```

Each Job name includes a timestamp-based suffix (28504821, 28504822).

* * *

## CronJob Concurrency Policies

What if a Job is still running when the next schedule triggers? Configure with `concurrencyPolicy`:

Policy

Behavior

`Allow` (default)

Create new Job even if previous is running

`Forbid`

Skip the new Job if previous is still running

`Replace`

Cancel the running Job and start a new one

For AI workloads (like embedding refresh), use `Forbid` to prevent overlapping:

```
apiVersion: batch/v1kind: CronJobmetadata:  name: embedding-refresh-nightlyspec:  schedule: "0 2 * * *"  concurrencyPolicy: Forbid    # Don't overlap runs  jobTemplate:    spec:      template:        spec:          containers:          - name: refresh            image: your-registry/embedding-refresher:v1            env:            - name: VECTOR_DB_URL              value: "http://qdrant:6333"          restartPolicy: OnFailure
```

* * *

## AI Agent Use Cases for Jobs and CronJobs

### Use Case 1: Nightly Embedding Refresh

Your RAG agent needs fresh embeddings from updated knowledge base:

```
apiVersion: batch/v1kind: CronJobmetadata:  name: embedding-syncspec:  schedule: "0 3 * * *"    # 3 AM daily  concurrencyPolicy: Forbid  jobTemplate:    spec:      template:        spec:          containers:          - name: sync            image: your-registry/embedding-sync:v1            env:            - name: OPENAI_API_KEY              valueFrom:                secretKeyRef:                  name: openai-credentials                  key: api-key            - name: QDRANT_URL              value: "http://qdrant:6333"            resources:              requests:                memory: "512Mi"                cpu: "500m"              limits:                memory: "1Gi"                cpu: "1"          restartPolicy: OnFailure
```

### Use Case 2: One-Time Model Migration

When upgrading your agent's model, run a migration Job:

```
apiVersion: batch/v1kind: Jobmetadata:  name: model-migration-v2spec:  template:    spec:      containers:      - name: migrate        image: your-registry/model-migrator:v2        env:        - name: SOURCE_MODEL          value: "gpt-3.5-turbo"        - name: TARGET_MODEL          value: "gpt-4o-mini"        - name: DB_URL          valueFrom:            secretKeyRef:              name: db-credentials              key: connection-string      restartPolicy: Never  backoffLimit: 2  ttlSecondsAfterFinished: 3600  # Auto-delete after 1 hour
```

**`ttlSecondsAfterFinished`**: Automatically delete the Job and its Pods after the specified seconds. Useful for one-time migrations you don't need to keep.

### Use Case 3: Parallel Document Processing

Process 1000 documents for a new knowledge base:

```
apiVersion: batch/v1kind: Jobmetadata:  name: document-ingestspec:  completions: 100    # 100 batches (10 docs each)  parallelism: 10     # Process 10 batches simultaneously  template:    spec:      containers:      - name: ingest        image: your-registry/doc-processor:v1        env:        - name: JOB_COMPLETION_INDEX          valueFrom:            fieldRef:              fieldPath: metadata.annotations['batch.kubernetes.io/job-completion-index']      restartPolicy: Never
```

**`JOB_COMPLETION_INDEX`**: Kubernetes injects a unique index (0-99) into each Pod. Your code uses this to determine which batch of documents to process.

* * *

## Key Concepts Summary

**Job**: Kubernetes primitive for running a task to completion. Creates Pods that stop after successful execution.

**CronJob**: Creates Jobs on a schedule using cron expressions. Manages Job history automatically.

**completions**: Number of successful Pod completions required for the Job to finish.

**parallelism**: Maximum number of Pods that can run simultaneously.

**restartPolicy**: Must be `Never` or `OnFailure` for Jobs (not `Always`).

**backoffLimit**: Number of retries before marking a Job as failed.

**concurrencyPolicy**: How CronJobs handle overlapping executions (`Allow`, `Forbid`, `Replace`).

**ttlSecondsAfterFinished**: Auto-cleanup of completed Jobs after a time period.

* * *

## Try With AI

Open a terminal and work through these scenarios:

### Scenario 1: Design a Backup Job

**Your task:** Create a Job that backs up your agent's conversation history to an S3 bucket.

Ask AI: "Create a Kubernetes Job manifest that runs an S3 backup using the AWS CLI. It should copy files from /data/conversations to s3://my-bucket/backups/."

Review AI's response:

-   Is the image appropriate (e.g., `amazon/aws-cli`)?
-   Are AWS credentials handled securely (via Secrets, not hardcoded)?
-   Is `restartPolicy` set correctly?
-   Is there a `backoffLimit` for retries?

Tell AI: "The Job should mount a PersistentVolumeClaim named 'agent-data' to access the conversation files."

**Reflection:**

-   How does the Job access the PVC?
-   What happens if the S3 upload fails mid-transfer?
-   Would you use `restartPolicy: Never` or `OnFailure` here?

### Scenario 2: Debug a Failing CronJob

**Your task:** Your nightly CronJob hasn't run successfully in 3 days. Diagnose the issue.

Ask AI: "My CronJob named 'nightly-sync' shows LAST SCHEDULE was 3 days ago but ACTIVE is 0. What commands should I run to diagnose this?"

AI should suggest:

-   `kubectl describe cronjob nightly-sync`
-   `kubectl get jobs` (look for failed Jobs)
-   `kubectl describe job <failed-job-name>`
-   `kubectl logs <pod-name>`

Ask: "The Job Pod shows ImagePullBackOff. What does this mean and how do I fix it?"

**Reflection:**

-   What's the difference between CronJob, Job, and Pod failures?
-   Where do you look first when a CronJob stops working?
-   How does `failedJobsHistoryLimit` affect debugging?

### Scenario 3: Optimize Parallel Processing

**Your task:** You have a Job processing 1000 items with `completions: 1000` and `parallelism: 50`. It's consuming too many cluster resources.

Ask AI: "How can I run a Kubernetes Job that processes 1000 items but limits resource consumption? Currently using parallelism: 50 but it's overwhelming the cluster."

AI might suggest:

-   Reduce `parallelism` to 10-20
-   Add resource requests/limits to each Pod
-   Use indexed Jobs with a work queue pattern
-   Process multiple items per Pod (reduce total completions)

Ask: "Show me how to use a work queue pattern instead of one Pod per item."

**Reflection:**

-   What's the trade-off between parallelism and completion time?
-   When is the indexed Job pattern better than a work queue?
-   How do resource limits on Job Pods affect scheduling?

* * *

## Reflect on Your Skill

You built a `kubernetes-deployment` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my kubernetes-deployment skill, create a Job for batch processing and a CronJob for scheduled tasks.Does my skill generate Job manifests with completions, parallelism, and proper restartPolicy?
```

### Identify Gaps

Ask yourself:

-   Did my skill include Job vs Deployment distinction (finite vs long-running workloads)?
-   Did it explain parallelism and completions for batch processing?
-   Did it cover CronJob scheduling with cron expressions and concurrency policies?
-   Did it include AI agent use cases (embedding refresh, log cleanup, model migration)?

### Improve Your Skill

If you found gaps:

```
My kubernetes-deployment skill is missing Job and CronJob patterns for batch workloads.Update it to include Job parallelism configuration, CronJob scheduling syntax, concurrency policies, and AI-specific batch processing patterns.
```

* * *

Checking access...

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 50: Kubernetes for AI Services](/docs/AI-Cloud-Native-Development/kubernetes-for-ai-services)
-   AI-Assisted Kubernetes with kubectl-ai

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/50-kubernetes-for-ai-services/13-ai-assisted-kubernetes-kubectl-ai.md)

# AI-Assisted Kubernetes with kubectl-ai

By Lesson 7, you've learned Kubernetes concepts deeply: control plane architecture, pod lifecycle, deployments with rolling updates, services, configuration injection, resource management. You can read manifests and understand why each field matters.

Now comes the efficiency problem: Writing Kubernetes manifests by hand is verbose. A deployment requires apiVersion, kind, metadata, spec, replicas, selectors, template specifications, resource requests, and health checks. That's 50+ lines for a simple deployment.

This is where kubectl-ai bridges the gap. Instead of hand-typing manifests, you describe what you want in natural language. kubectl-ai generates the YAML. You review it against your L1 knowledge, suggest improvements, and iterate—collaborating toward a production-ready manifest much faster than manual typing.

* * *

## Installing and Using kubectl-ai

kubectl-ai is a kubectl plugin that translates natural language commands to Kubernetes operations. It leverages LLM reasoning to understand intent and generate correct manifests.

### Installation

kubectl-ai extends kubectl through the plugin system. Install it:

```
# Install via pip (requires Python 3.8+)pip install kubectl-ai# Or via Homebrew (macOS/Linux)brew install kubectl-ai# Verify installationkubectl ai --version
```

**Output:**

```
kubectl-ai version 0.2.0
```

Once installed, kubectl-ai integrates as a native kubectl plugin. You can invoke it with `kubectl ai` or `kubectl ai --help` to see available commands.

### How It Works: Three Interaction Patterns

kubectl-ai supports three core interaction patterns, each suited to different situations:

**Pattern 1: Generate Manifests from Description**

```
kubectl ai "Deploy nginx with 3 replicas, expose on port 80"
```

The plugin translates your description into a valid Deployment manifest, complete with selectors, resource requests, and best practices.

**Pattern 2: Generate Kubectl Commands from Intent**

```
kubectl ai "Show me all pods that are not in running state"
```

kubectl-ai converts this intent into `kubectl get pods --field-selector=status.phase!=Running`.

**Pattern 3: Explain Existing Manifests or Commands**

```
kubectl ai --explain "kubectl apply -f deployment.yaml"
```

The plugin explains what a kubectl command does, useful for understanding operational patterns.

This lesson focuses on Pattern 1 (manifest generation), which is where AI collaboration provides the most value: reducing manual typing while teaching you to evaluate quality.

* * *

## From Natural Language to Production Manifest: A Collaboration Journey

To show how kubectl-ai works in practice, let's walk through a realistic scenario: deploying your FastAPI agent from Chapter 49 to Kubernetes.

### Your Starting Point

You have:

-   A Docker image `my-agent:1.0` pushed to Docker Hub
-   Knowledge of your agent's resource requirements (256MB RAM, 100m CPU)
-   A health check endpoint at `/health` that returns `{"status": "healthy"}`
-   A requirement for 3 replicas in production

### Round 1: Initial Request to kubectl-ai

You start with a straightforward description:

**Your request:**

```
Generate a Kubernetes Deployment for my FastAPI agent.Use image my-agent:1.0 from Docker Hub.3 replicas.Expose port 8000.Name it my-agent-deployment.
```

**kubectl-ai generates:**

```
apiVersion: apps/v1kind: Deploymentmetadata:  name: my-agent-deployment  namespace: defaultspec:  replicas: 3  selector:    matchLabels:      app: my-agent  template:    metadata:      labels:        app: my-agent    spec:      containers:      - name: my-agent        image: my-agent:1.0        ports:        - containerPort: 8000
```

**Your evaluation** (using L1 knowledge from Lessons 1-7):

You review this manifest against what you learned:

-   ✓ The selector and labels match (lesson 3)
-   ✓ ReplicaSet will ensure 3 pods (lesson 4)
-   ✓ Container port is correct
-   ✗ Missing: Resource requests/limits (should have defined in lesson 7)
-   ✗ Missing: Health checks—the `/health` endpoint exists but isn't configured
-   ✗ Missing: Image pull policy (what if the image isn't present?)

The manifest is functionally correct but incomplete for production. This is exactly the collaboration moment.

### Round 2: Teaching kubectl-ai Your Constraints

You describe what the initial manifest missed:

**Your refined request:**

```
Update the deployment. The agent uses 256MB RAM and 100m CPU.Add a liveness probe on /health endpoint (port 8000, path /health).Add a readiness probe on the same endpoint.The image might not be on the node, so use imagePullPolicy: IfNotPresent.
```

**kubectl-ai generates:**

```
apiVersion: apps/v1kind: Deploymentmetadata:  name: my-agent-deployment  namespace: defaultspec:  replicas: 3  selector:    matchLabels:      app: my-agent  template:    metadata:      labels:        app: my-agent    spec:      containers:      - name: my-agent        image: my-agent:1.0        imagePullPolicy: IfNotPresent        ports:        - containerPort: 8000        resources:          requests:            memory: "256Mi"            cpu: "100m"          limits:            memory: "512Mi"            cpu: "200m"        livenessProbe:          httpGet:            path: /health            port: 8000          initialDelaySeconds: 10          periodSeconds: 10        readinessProbe:          httpGet:            path: /health            port: 8000          initialDelaySeconds: 5          periodSeconds: 5
```

**Your evaluation:**

Now you're comparing a more complete manifest against your L1 foundation:

-   ✓ Resources defined with requests and limits (lesson 7)
-   ✓ Probes configured with httpGet on the health endpoint (lesson 7)
-   ✓ Image pull policy prevents problems if image isn't cached locally
-   ✓ Delay and period values are reasonable for a startup-sensitive agent

BUT:

-   ✗ The limits are 2x the requests (512Mi memory, 200m CPU). For a development agent, this might be excessive
-   ✗ Initial delay of 10 seconds—what if your agent takes longer to start up initially?

### Round 3: Production Context Refinement

You have production experience: your agent sometimes takes 20+ seconds to initialize (it loads models). Also, the resource limits seem generous for a development cluster:

**Your request:**

```
Increase the liveness probe initialDelaySeconds to 20.Reduce the memory limit to 384Mi (the agent doesn't use all 512Mi).Keep the CPU request and limit—those look right.Add a nice name for the container.
```

**kubectl-ai generates:**

```
apiVersion: apps/v1kind: Deploymentmetadata:  name: my-agent-deployment  namespace: defaultspec:  replicas: 3  selector:    matchLabels:      app: my-agent  template:    metadata:      labels:        app: my-agent    spec:      containers:      - name: fastapi-agent        image: my-agent:1.0        imagePullPolicy: IfNotPresent        ports:        - name: http          containerPort: 8000        resources:          requests:            memory: "256Mi"            cpu: "100m"          limits:            memory: "384Mi"            cpu: "200m"        livenessProbe:          httpGet:            path: /health            port: http          initialDelaySeconds: 20          periodSeconds: 10        readinessProbe:          httpGet:            path: /health            port: 8000          initialDelaySeconds: 5          periodSeconds: 5
```

**What changed** through iteration:

-   Memory limit reduced from 512Mi to 384Mi (more realistic)
-   Liveness probe delay increased to 20 seconds (your agent's startup time)
-   Container named `fastapi-agent` instead of generic `my-agent`
-   Port named `http` (allows referencing by name instead of number)

None of these changes were obvious from your initial description. But through dialogue—describing constraints and production experience—the manifest evolved toward a configuration that actually reflects how your agent behaves.

* * *

## Debugging with kubectl-ai: Collaborative Problem-Solving

kubectl-ai isn't just for generation. It's valuable for debugging too. When something goes wrong, you can describe the symptom and iterate on solutions.

### Scenario: Pod Not Starting

You deploy and pods are stuck in `CrashLoopBackOff`. You don't know why.

**Your prompt:**

```
My deployment is in CrashLoopBackOff.The container starts but exits immediately.How do I investigate this with kubectl commands?What should I look for in the logs?
```

**kubectl-ai suggests:**

```
# Check pod statuskubectl describe pod <pod-name># Read logs from the crashed containerkubectl logs <pod-name> --previous# Check for resource constraints causing OOMkubectl describe node <node-name># Look for event detailskubectl get events --sort-by='.lastTimestamp'
```

You run `kubectl logs <pod-name> --previous` and see:

```
ImportError: No module named 'transformers'
```

Your Python environment is missing dependencies. This insight came from the collaborative debugging pattern: you described the symptom, kubectl-ai suggested diagnostic commands, and you got the information needed to fix the root cause.

### Scenario: Service Discovery Isn't Working

Your frontend can't reach your backend pods:

**Your description:**

```
My frontend pod is trying to reach the backend service.It's using the DNS name my-backend-service.But it times out trying to connect.What could be wrong?Generate commands to debug this.
```

**kubectl-ai generates diagnostic steps:**

```
# Verify the service existskubectl get svc my-backend-service# Check if service has endpointskubectl get endpoints my-backend-service# Try DNS resolution from a podkubectl run -it --rm debug --image=busybox -- nslookup my-backend-service# Check if pods are actually running and healthykubectl get pods -l app=my-backend --show-labels# Verify the port matches the service definitionkubectl describe svc my-backend-service
```

Running these steps, you discover: The backend service has zero endpoints. The label selector doesn't match any running pods. You add the correct labels, and service discovery works.

This is the core value of kubectl-ai for debugging: It helps you think through diagnostic steps without having to memorize kubectl command syntax.

* * *

## Critical Evaluation: Why Manual Knowledge Matters

The examples above show the collaborative pattern working. But they also highlight why your L1 foundation from Lessons 1-7 is essential.

### Example 1: Recognizing Over-Specification

kubectl-ai generates:

```
resources:  limits:    memory: "512Mi"    cpu: "500m"
```

Without L1 knowledge (from Lesson 7), you might accept these limits as correct. But you know from lesson 7:

-   QoS tier "Guaranteed" requires requests == limits
-   For a development agent, you probably want "Burstable" (requests < limits)
-   500m CPU is excessive for a FastAPI service doing inference, not compute

Your evaluation prevents a misconfigurations that would waste cluster resources.

### Example 2: Recognizing Missing Health Checks

kubectl-ai might generate:

```
# No livenessProbe or readinessProbe
```

Without L1 knowledge (Lesson 7), you might deploy this. Kubernetes would run your pods, but:

-   If a pod hangs (responds but doesn't process), Kubernetes doesn't know to restart it
-   If a pod is starting, Kubernetes might send traffic before it's ready

Your L1 knowledge flags this as incomplete and you request the health checks.

### Example 3: Catching Image Pull Issues

kubectl-ai generates:

```
imagePullPolicy: Always
```

This works for public images, but fails if:

-   Your image is in a private registry (no credentials specified)
-   You're testing locally with Docker Desktop Kubernetes (image not available remotely)

Only knowing Kubernetes fundamentals (Lesson 3: image pull behavior) lets you catch and correct this.

**The pattern**: kubectl-ai generates manifests following general best practices. But you evaluate them through domain knowledge and production context. That evaluation catches issues before they fail in production.

* * *

## Iterative Refinement in Practice: Your Agent Deployment

Let's walk through what iteration looks like across multiple rounds:

**Round 1 Request:**

```
Create a Deployment for my agent (image: my-agent:1.0).3 replicas.Port 8000.
```

**kubectl-ai output:** Basic deployment (Lesson 4 level)

**Your feedback:** "Add resource limits and health checks because this is production."

**Round 2 Request:**

```
The agent needs 256MB RAM and 100m CPU.Add health checks on /health endpoint.
```

**kubectl-ai output:** Deployment with resources and probes (Lesson 7 level)

**Your feedback:** "The initialization is slow—20 seconds before the agent is ready. Update the liveness delay. Also, the memory limit seems high—should be 384Mi max."

**Round 3 Request:**

```
Set liveness initialDelaySeconds to 20.Set memory limit to 384Mi.
```

**kubectl-ai output:** Refined deployment

**Your evaluation:**

-   ✓ Matches your constraints
-   ✓ Production-appropriate for your use case
-   ✓ Ready to deploy

The journey from Round 1 to Round 3 shows how collaborative iteration works:

1.  Start with simplicity (Round 1)
2.  Add constraints your domain knowledge recognizes (Round 2)
3.  Refine based on actual behavior (Round 3)
4.  Deploy with confidence

This is more efficient than hand-writing all 50+ lines while researching each field in the kubectl docs. But it requires your L1 foundation to evaluate quality.

* * *

## When to Use kubectl-ai (And When Not To)

### Perfect Use Cases

**1\. Generating boilerplate from requirements**

```
"Deploy Redis with persistence, memory limit 2Gi, replicas 1"
```

Instead of hand-typing a StatefulSet, redis config, persistent volume, and service, describe what you need and iterate.

**2\. Debugging unknown kubectl commands**

```
"I need to check why this pod keeps restarting. Show me the commands."
```

More efficient than searching documentation.

**3\. Exploring alternatives**

```
"What's the difference between using a ConfigMap vs environment variables for configuration?"
```

Quick explanation with examples.

### When Manual Writing Is Better

**1\. Complex architectural changes**

If you're redesigning a multi-service deployment, writing the spec by hand forces you to think through relationships. AI generation might miss architectural intent.

**2\. Security-sensitive configurations**

Secrets management, RBAC policies, network policies. Review these line-by-line manually, not through AI suggestions.

**3\. Teaching others**

When training team members, hand-written manifests with annotations teach better than AI-generated ones.

### The Balanced Approach

Use kubectl-ai for:

-   Initial scaffolding
-   Syntax generation
-   Diagnostic commands

Then review, refine, and customize based on your domain knowledge. This combines AI efficiency with human judgment.

* * *

## Try With AI

**Setup**: You have a containerized FastAPI agent from Chapter 49 (image: `my-agent:1.0` on Docker Hub). You need to deploy it to Kubernetes with the following requirements:

-   2 replicas (development deployment)
-   Port 8000
-   Health check endpoint: `/api/health` (returns JSON)
-   Memory allocation: 512MB request, 1GB limit
-   CPU allocation: 250m request, 500m limit
-   Image pull from Docker Hub (public image)
-   Container should wait 15 seconds before liveness check (agent startup time)

### Part 1: Initial Generation

Ask kubectl-ai to generate the deployment manifest based on these requirements:

```
kubectl ai "Generate a Deployment manifest for my FastAPI agent.Image: my-agent:1.0 from Docker Hub.2 replicas.Port 8000.Health check on /api/health endpoint.512MB memory request, 1GB limit.250m CPU request, 500m CPU limit.15 second startup delay for health checks."
```

### Part 2: Critical Review

Review the generated manifest. Use your L1 knowledge from Lessons 1-7 to evaluate:

-   Does it have the right labels for service discovery?
-   Are the resource requests and limits correctly specified?
-   Do the probes have reasonable initial delay and period values?
-   Is the image pull policy appropriate?
-   Does it specify the health check port correctly?

Make note of anything that looks incomplete or incorrect.

### Part 3: Constraint Refinement

Based on your review, provide kubectl-ai with feedback. For example:

```
The manifest looks good overall. But:- The memory limit should be 768Mi, not 1GB.- Use imagePullPolicy: IfNotPresent for development.- The readiness probe should respond faster (initialDelaySeconds 5).
```

Ask kubectl-ai to update the manifest with these constraints.

### Part 4: Validation Check

Compare the updated manifest against the original:

-   What changed?
-   Why did those changes make sense?
-   Does the updated manifest match your actual agent requirements better?

### Part 5: Practical Deployment Decision

Looking at the final manifest, ask yourself:

-   Could you deploy this to your cluster immediately?
-   Would you modify anything else before applying it?
-   What would you monitor after deployment (based on resource limits and probes)?
-   If a pod crashed, where would you look first to understand why?

This is the practical thinking that complements AI generation—using your kubectl foundation to make confident production decisions.

* * *

## Reflect on Your Skill

You built a `kubernetes-deployment` skill in Lesson 0. Test and improve it based on what you learned.

### Test Your Skill

```
Using my kubernetes-deployment skill, generate a complete Deployment manifest from a natural language description.Does my skill produce production-ready YAML with all necessary components (resources, probes, labels, selectors)?
```

### Identify Gaps

Ask yourself:

-   Did my skill include manifest generation from requirements (like kubectl-ai does)?
-   Did it explain the iterative refinement process (initial generation → review → constraints → refinement)?
-   Did it cover critical evaluation patterns (recognizing over-specification, missing health checks, image pull issues)?
-   Did it include validation steps to ensure AI-generated manifests are production-appropriate?

### Improve Your Skill

If you found gaps:

```
My kubernetes-deployment skill is missing AI-assisted manifest generation and validation patterns.Update it to include natural language → YAML translation, iterative refinement workflows, critical evaluation checklists, and production readiness validation.
```

* * *

Checking access...

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 50: Kubernetes for AI Services](/docs/AI-Cloud-Native-Development/kubernetes-for-ai-services)
-   Capstone: Deploy Your Part 6 Agent to Kubernetes

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/50-kubernetes-for-ai-services/14-capstone-production-ready-agent.md)

# Capstone: Deploy Your Part 6 Agent to Kubernetes

Your FastAPI agent from Chapter 49 is containerized and pushed to a registry. Now deploy it to a production-like environment using Kubernetes.

This capstone differs from earlier lessons: **you start with a specification, not a command**. Write out what you're deploying and why. Then have AI generate the manifests that implement your specification. Finally, deploy your agent, configure it with secrets and environment variables, and validate that Kubernetes is managing it correctly (scaling, self-healing, logging).

By the end, your agent will run on a Kubernetes cluster, surviving Pod crashes and responding to scaling demands—all orchestrated by Kubernetes' declarative model.

* * *

## The Specification-First Approach

Before you write a single line of YAML, specify what you're building.

A specification answers these questions:

-   **What** are we deploying? (What's the container? Where is it?)
-   **Why** are we deploying it this way? (What constraints drive our choices?)
-   **How many** copies should run? (What's the replicas count based on?)
-   **What configuration** does it need? (Environment variables, secrets, resource limits?)
-   **How do we validate** it's working? (Health checks, access tests, what success looks like?)

Here's a template to guide your thinking:

```
## Deployment Specification: [Agent Name]### Intent[1-2 sentences: What problem does this solve? Why deploy to Kubernetes?]### Container Details- Image: [registry/image:tag]- Port: [Which port does your agent listen on?]- Image pull policy: [Always/IfNotPresent]### Replicas & Scaling- Desired replicas: [number]- Why this count: [Load expectations? High availability?]### Configuration- Environment variables needed: [List all]  - OPENAI_API_KEY: [From Secret]  - Other vars: [From ConfigMap]- Resource requests: [CPU/memory your agent needs]- Resource limits: [Upper bounds to prevent resource contention]### Health Checks- Readiness probe: [What endpoint shows the agent is ready?]- Liveness probe: [What endpoint proves the agent is still alive?]### Networking- Service type: [ClusterIP/NodePort/LoadBalancer]- External access: [Do external clients need to reach this? How?]### Success Criteria- [ ] Deployment creates all replicas- [ ] Service is accessible (internally or externally)- [ ] Health checks pass- [ ] Environment variables are injected correctly- [ ] Pod recovery works (delete Pod, verify automatic restart)
```

This specification becomes the contract between you and Kubernetes. AI will read it and generate manifests that fulfill the contract.

* * *

## Writing Your Specification

Before proceeding to AI, write your specification in a text editor or document.

### Key Details for Your Part 6 Agent

**Container image**: This is the image you pushed in Chapter 49. Remember the format:

```
[registry]/[repository]:[tag]
```

Example: `ghcr.io/yourusername/part6-agent:latest`

**Port**: Your FastAPI agent listens on port 8000 by default (unless you configured differently in Chapter 49).

**Environment variables**: Your agent needs:

-   `OPENAI_API_KEY`: Your OpenAI API key (should be in a Secret for security)
-   Any other config from Chapter 49? (Database URLs, model names, API endpoints?)

**Readiness and liveness probes**: FastAPI's health check endpoint is typically `/health` or you can use the root endpoint `/` and check for HTTP 200.

**Replicas**: For learning purposes, 2-3 replicas is appropriate (shows redundancy). For production load, you'd scale higher.

**Resources**: A FastAPI agent with OpenAI calls is lightweight:

-   Request: CPU 100m (100 millicores), Memory 256Mi
-   Limit: CPU 500m, Memory 512Mi

**Service exposure**: For Docker Desktop development, NodePort is practical (access via localhost). For cloud clusters, LoadBalancer or Ingress.

* * *

## Example Specification (For Reference)

Here's what a completed specification looks like:

```
## Deployment Specification: Part 6 AI Agent### IntentDeploy the Part 6 FastAPI agent to Kubernetes with automatic scaling andself-healing. Agent should survive Pod crashes and scale to handle loadvariations.### Container Details- Image: ghcr.io/yourusername/part6-agent:v1.0- Port: 8000- Image pull policy: Always (always fetch latest image)### Replicas & Scaling- Desired replicas: 3- Why this count: High availability (can lose 1 Pod without service interruption)### Configuration- Environment variables needed:  - OPENAI_API_KEY: From Secret named "agent-secrets"  - LOG_LEVEL: From ConfigMap, set to "INFO"  - API_TIMEOUT: From ConfigMap, set to "30s"- Resource requests: CPU 100m, Memory 256Mi- Resource limits: CPU 500m, Memory 512Mi### Health Checks- Readiness probe: GET /health (HTTP 200 means ready)- Liveness probe: GET /health (HTTP 200 means alive)- Both: initial delay 5 seconds, check every 10 seconds### Networking- Service type: NodePort- External access: Yes—external clients access agent via service on port 30080### Success Criteria- [ ] Deployment creates 3 replicas- [ ] Service is accessible via kubectl port-forward or NodePort- [ ] Health checks pass- [ ] OPENAI_API_KEY is injected correctly (from Secret)- [ ] Pod recovery works (delete a Pod, verify new one starts automatically)
```

Use this as a model, then customize it for YOUR agent and deployment preferences.

* * *

## Generating Manifests from Specification

Once you've written your specification, you have two approaches:

**Approach 1: Manual (Educational)**

-   Write each manifest yourself based on your specification
-   Good for learning—you control every line
-   Time-intensive

**Approach 2: AI-Assisted (Practical)**

-   Copy your specification into a prompt
-   Have AI generate the complete manifest suite
-   Then review and validate the output

For this capstone, **use Approach 2**—this demonstrates the core AI-native workflow: Specification → AI Generation → Validation.

### The Prompt Structure for AI

When asking AI to generate manifests, provide:

1.  **Your specification** (copy/paste)
2.  **Context about your agent**: What does it do? What does it need?
3.  **Deployment environment**: Are you using Docker Desktop Kubernetes or a cloud cluster?
4.  **Success criteria**: What must the manifests include to pass validation?

Here's a template:

```
I need to deploy a containerized AI agent to Kubernetes.## Deployment Specification[Paste your specification here]## Agent Context- Container image: [image]- Port: [port]- Environment needs: [list]## Deployment Environment[Docker Desktop Kubernetes on localhost OR Cloud cluster (GKE/EKS/AKS)]## Manifest RequirementsGenerate the following:1. ConfigMap: Store LOG_LEVEL and API_TIMEOUT2. Secret: Store OPENAI_API_KEY3. Deployment:   - Image from my specification   - Inject ConfigMap and Secret as environment variables   - Include readiness and liveness probes   - Set resource requests and limits4. Service:   - Type: NodePort (for Docker Desktop)   - Expose port 8000 from container   - Target port 30080 (or similar)Ensure all manifests use the same labels and selectors so the Service routes to the Deployment Pods.Return YAML that I can immediately apply with `kubectl apply -f manifest.yaml`
```

* * *

## Deployment Steps

Once you have your manifests (either written by hand or generated by AI), deploy them to your Kubernetes cluster.

### Step 1: Verify Cluster Access

```
kubectl cluster-infokubectl get nodes
```

If using Docker Desktop, ensure Kubernetes is enabled (green indicator in Docker Desktop).

### Step 2: Create Namespace (Optional but Recommended)

```
kubectl create namespace agent-appkubectl config set-context --current --namespace=agent-app
```

This isolates your deployment and makes cleanup easier.

### Step 3: Apply Manifests

```
kubectl apply -f configmap.yamlkubectl apply -f secret.yamlkubectl apply -f deployment.yamlkubectl apply -f service.yaml
```

Or apply all at once:

```
kubectl apply -f *.yaml
```

### Step 4: Verify Deployment

```
# Check Deployment statuskubectl get deployment# Check Pods are runningkubectl get pods# Check Service is createdkubectl get svc# Detailed Pod infokubectl describe pod [pod-name]
```

### Step 5: Test External Access

**For Docker Desktop + NodePort**:

```
# Get the NodePort (e.g., 30080)kubectl get svc agent-service -o jsonpath='{.spec.ports[0].nodePort}'# Access your agent via localhostcurl http://localhost:[nodeport]/health
```

**For kubectl port-forward** (alternative):

```
kubectl port-forward svc/agent-service 8000:8000curl http://localhost:8000/health
```

**For cloud cluster + LoadBalancer**:

```
kubectl get svc agent-service# Wait for EXTERNAL-IP to populate, then:curl http://[external-ip]:8000/health
```

* * *

## Validation Checklist

Run through this checklist to confirm your deployment succeeded:

### Deployment Health

-    **All Pods are Running**
    
    ```
    kubectl get pods# All should show STATUS: Running
    ```
    
-    **Desired Replicas Match Actual**
    
    ```
    kubectl get deployment# DESIRED, CURRENT, READY should all be equal
    ```
    
-    **Readiness Probes Pass**
    
    ```
    kubectl get pods# All Pods should show READY 1/1
    ```
    

### Configuration Injection

-    **Environment Variables are Set**
    
    ```
    kubectl exec [pod-name] -- env | grep OPENAI_API_KEY# Should show the key is populated
    ```
    
-    **ConfigMap Values are Injected**
    
    ```
    kubectl exec [pod-name] -- env | grep LOG_LEVEL# Should show your configured value
    ```
    

### Networking & Access

-    **Service Exists and Routes to Pods**
    
    ```
    kubectl get endpoints agent-service# Should show IP addresses of Pods
    ```
    
-    **Agent Responds to Health Check**
    
    ```
    curl http://[service-ip]:[port]/health# Should return HTTP 200
    ```
    
-    **External Access Works** (NodePort or LoadBalancer)
    
    ```
    # Test from outside the clustercurl http://[external-ip]:[port]/health
    ```
    

### Self-Healing Verification

-    **Pod Recovery Works**
    
    ```
    # Record initial Pod namekubectl get podsPOD_NAME=$(kubectl get pods -o jsonpath='{.items[0].metadata.name}')# Delete a Podkubectl delete pod $POD_NAME# Wait a few seconds, verify new Pod was createdkubectl get pods# New Pod should be Running (different name)
    ```
    
-    **Desired State Maintains Replicas**
    
    ```
    # Delete multiple Podskubectl delete pod --all# Wait for recoverykubectl get pods# Should have recreated all replicas automatically
    ```
    

### Logging Verification

-    **Logs are Accessible**
    
    ```
    kubectl logs [pod-name]# Should see your agent's startup logs
    ```
    
-    **Recent Requests are Logged**
    
    ```
    # After making a request to your agent:kubectl logs [pod-name] --tail=20# Should see request in logs
    ```
    

* * *

## Try With AI

Use AI to help debug issues and explore advanced deployment scenarios. This section demonstrates the three-role collaboration that makes AI-native development effective.

### Part 1: Validate Your Manifests

**Ask AI**:

```
Review my Kubernetes manifests for correctness. I want to deploy a FastAPIagent to Docker Desktop Kubernetes. Check for:- Correct label selectors (Service routes to Deployment Pods)- Proper environment variable injection (ConfigMap and Secret)- Appropriate resource requests/limits for a lightweight FastAPI app- Valid readiness/liveness probe configurationHere are my manifests:[Paste your YAML files]Are there any issues that would prevent successful deployment?
```

**What to evaluate**:

-   Does AI catch obvious errors (wrong image name, mismatched selectors)?
-   Are the suggestions aligned with your specification?
-   Did you miss any configuration that AI suggests?

### Part 2: Troubleshoot Deployment Issues

If your deployment fails, use AI to diagnose:

**Ask AI**:

```
My Deployment isn't creating Pods. Here's what I see:kubectl get deployment:[Paste output]kubectl describe deployment agent-deployment:[Paste output]kubectl get events:[Paste output]What's preventing the Pods from starting?
```

**What to evaluate**:

-   AI correctly interprets kubectl output
-   AI identifies the root cause (image pull error, resource constraints, etc.)
-   AI's suggestion points to a specific fix you can try

**Then refine**: Based on AI's analysis, describe what you tried:

```
I applied your fix:[Describe what you did]But now I see this error:[New error message]What should I try next?
```

### Part 3: Validate Self-Healing Behavior

**Ask AI**:

```
I want to confirm Kubernetes is actually self-healing my Pods. Here's mycurrent deployment state:kubectl get pods:[Paste output showing 3 Pods]Now I'm going to delete one Pod. Here's what happens:[Delete Pod and immediately show output]Then after 10 seconds:[Show output again]Did Kubernetes correctly recover and replace the deleted Pod?
```

**What to evaluate**:

-   AI correctly interprets the before/after Pod states
-   AI confirms that a new Pod was created (different name, recent age)
-   AI explains why this proves self-healing works

### Part 4: Test External Access

**Ask AI**:

```
I'm trying to access my agent from outside the cluster. Here's what I tried:Using localhost with NodePortkubectl get svc: [output showing NodePort]curl http://[ip]:[port]/health: [response or error]Why isn't my agent responding?
```

**What to evaluate**:

-   AI identifies if port forwarding is needed vs NodePort vs LoadBalancer
-   AI suggests debugging steps specific to your deployment environment
-   AI's advice is actionable and tests the right thing

### Part 5: Final Validation Synthesis

**Ask AI**:

```
I've completed the deployment and run the validation checklist. Here'swhat I confirmed:[Paste results of your validation checks]Based on this evidence, should I consider this capstone complete? Whatwould you look for as proof that deployment succeeded?
```

**What to evaluate**:

-   AI acknowledges which checks you've completed successfully
-   AI identifies any gaps remaining before the capstone is done
-   AI confirms that your specification has been fully validated in practice

* * *

**Remember**: The goal of this capstone is not just to deploy your agent, but to understand how specification-first development works. Your specification is the contract. The manifests implement it. Kubernetes ensures the contract is maintained (desired state = observed state, always).

When self-healing works (Pod dies, new one starts), you're seeing the declarative model in action.

Checking access...

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 50: Kubernetes for AI Services](/docs/AI-Cloud-Native-Development/kubernetes-for-ai-services)
-   Test and Refine Your Kubernetes Skill

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/50-kubernetes-for-ai-services/15-building-kubernetes-deployment-skill.md)

# Test and Refine Your Kubernetes Skill

You built your Kubernetes skill in Lesson 0 and refined it through Lessons 1-14. Now validate that it actually transfers to new projects.

A skill that only works for your FastAPI agent isn't a skill—it's a template. True skills guide decisions across different application types.

* * *

## Choose a Different Application

Pick one application type you haven't deployed in this chapter:

Type

Characteristics

**Data processing job**

Runs 1-2 hours, high CPU/memory, processes large files

**Node.js web service**

HTTP requests, external API connections, high availability

**Go batch processor**

Runs periodically, external config, needs graceful shutdown

**Python API gateway**

Routes to multiple backends, high volume, low latency

The application type doesn't matter. What matters: it's different enough from your FastAPI agent that you can't copy manifests from Lesson 14.

* * *

## Work Through Your Skill

Using only your skill (not Lesson 14's code), answer these questions for your chosen application:

**1\. Resource Planning**

-   What CPU and memory requests/limits would you set?
-   How did you arrive at these numbers?

**2\. Health Checking**

-   What probes does this application need?
-   How would you implement them?

**3\. Configuration**

-   What belongs in ConfigMaps vs Secrets?
-   How would you inject them?

**4\. Labels**

-   How would you structure labels for this application?
-   What queries would operators run against these labels?

**5\. Deployment Strategy**

-   What special considerations exist for updating this application?
-   Does it need different rollout parameters than your agent?

Your skill should guide you through these decisions without prescribing specific answers.

* * *

## Identify Gaps

After working through your skill on a different application:

Question

Your Answer

What worked?

Which guidance forced useful analysis?

What was missing?

What decisions did the skill not address?

What was too prescriptive?

Did any guidance feel like rules instead of frameworks?

Document 2-3 specific gaps you discovered.

* * *

## Refine Your Skill

Open your skill at `.claude/skills/kubernetes-deployment/SKILL.md` and add:

1.  **Missing decision points** — Questions your skill didn't help you answer
2.  **Application-specific patterns** — Guidance for batch jobs, gateways, or other types you tested
3.  **Edge cases** — Situations where the general guidance doesn't apply

Your skill grows with each application you deploy.

* * *

## Try With AI

**Validate skill transferability with Claude:**

```
I have a Kubernetes deployment skill I built during this chapter. Now I wantto deploy a [your chosen application type] that:- [characteristic 1]- [characteristic 2]- [characteristic 3]Using my skill (attached), walk me through the deployment decisions. As youwork through each decision point, tell me:- Which parts of my skill guide clearly?- Where is guidance missing or unclear?- What should I add to make this skill work for this application type?[Paste your SKILL.md content]
```

**What you're learning:** How to validate that intelligence you've captured actually transfers to new contexts—the difference between a template and a skill.

* * *

## Reflection

Your skill started from official documentation in Lesson 0. Through 14 lessons, you learned what those patterns mean in practice. Now you've tested whether your skill captures that learning in transferable form.

A well-designed skill guides fundamentally similar decisions (resource balance, health checking, configuration injection) even when the specific answers differ by application type.

**Next:** Optional lessons 16-22 cover advanced patterns. Each one is an opportunity to extend your skill with specialized guidance.

Checking access...

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 50: Kubernetes for AI Services](/docs/AI-Cloud-Native-Development/kubernetes-for-ai-services)
-   Init Containers (Optional)

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/50-kubernetes-for-ai-services/16-init-containers-optional.md)

# Init Containers: Preparing the Environment

Your AI agent from Chapter 49 is running on Kubernetes. But there's a timing problem: **the agent container starts before its dependencies are ready**.

Imagine deploying a sentiment analysis agent that needs a 500MB language model. If the container starts before the model is downloaded, the agent crashes immediately. You could add retry logic to the application, but that's fragile. Or you could use **init containers**—lightweight setup containers that run to completion before your main application container even starts.

Init containers solve the "dependencies ready" problem elegantly. They guarantee: download model weights, verify database connectivity, wait for configuration files—all before your production code runs.

* * *

## Why Init Containers?

### The Pod Startup Sequence

When you create a Pod, Kubernetes follows a strict sequence:

1.  **Init containers run** (one at a time, in order)
2.  **Wait for all init containers to succeed**
3.  **Only then start app containers**

If any init container fails, Kubernetes doesn't start the app containers. The Pod restarts and tries again.

### When Init Containers Are Essential

**You should use init containers when:**

-   Your app needs resources downloaded before starting (ML models, datasets, pre-compiled binaries)
-   Your app requires other services to be ready (waiting for database, cache, or message queue)
-   Your app needs shared configuration generated from secrets or ConfigMaps before startup
-   Your app requires environment setup that can't be done in application code (special permissions, directory structures, file ownership)

**Common patterns in production:**

-   Downloading and extracting model artifacts for ML services
-   Checking database schema and running migrations before app starts
-   Waiting for dependent services to be healthy
-   Initializing shared volumes with static assets or configuration files
-   Validating configuration files exist and are readable before main process starts

Compare this to your current approach: app container starts, tries to use a model that doesn't exist yet, crashes, Kubernetes restarts it, it crashes again. Repeated restart loops waste resources and delay startup.

### Example Problem: Agent Without Init Container

```
apiVersion: v1kind: Podmetadata:  name: sentiment-agentspec:  containers:  - name: agent    image: sentiment-agent:1.0    env:    - name: MODEL_PATH      value: /models/sentiment.bin    volumeMounts:    - name: models      mountPath: /models  volumes:  - name: models    emptyDir: {}
```

**Output when you deploy this:**

```
$ kubectl apply -f agent.yamlpod/sentiment-agent created$ kubectl logs sentiment-agentTraceback (most recent call last):  File "agent.py", line 12, in <module>    model = load_model('/models/sentiment.bin')FileNotFoundError: [Errno 2] No such file or directory: '/models/sentiment.bin'$ kubectl describe pod sentiment-agent...Last State:     Terminated  Reason:       Error  Exit Code:    1  Started:      2024-01-15T10:05:23Z  Finished:     2024-01-15T10:05:24ZRestart Count: 5...
```

The Pod enters a crash loop. Your agent never starts successfully.

### Solution: Init Container Downloads the Model

With an init container, the model downloads before the agent even starts:

```
apiVersion: v1kind: Podmetadata:  name: sentiment-agent-readyspec:  initContainers:  - name: download-model    image: curlimages/curl    command:    - sh    - -c    - |      echo "Downloading sentiment model..."      curl -fsSL https://models.example.com/sentiment.bin \        -o /models/sentiment.bin      echo "Model ready: $(du -h /models/sentiment.bin)"    volumeMounts:    - name: models      mountPath: /models  containers:  - name: agent    image: sentiment-agent:1.0    env:    - name: MODEL_PATH      value: /models/sentiment.bin    volumeMounts:    - name: models      mountPath: /models  volumes:  - name: models    emptyDir: {}
```

**Output when you deploy this:**

```
$ kubectl apply -f agent-with-init.yamlpod/sentiment-agent-ready created$ kubectl get pod sentiment-agent-readyNAME                      READY   STATUS     RESTARTS   AGEsentiment-agent-ready     0/1     Init:0/1   0          5s$ sleep 10$ kubectl get pod sentiment-agent-readyNAME                      READY   STATUS     RESTARTS   AGEsentiment-agent-ready     0/1     Init:0/1   0          15s$ sleep 10$ kubectl get pod sentiment-agent-readyNAME                      READY   STATUS    RESTARTS   AGEsentiment-agent-ready     1/1     Running   0          25s$ kubectl logs sentiment-agent-readyModel ready: 487M    /models/sentiment.binAgent starting on port 8000...
```

Notice the progression: `Init:0/1` (downloading) → `Running` (successful). The app container never starts until the model is ready. No crash loops. No retry logic in your application code.

* * *

## Creating Your First Init Container

Let's build a working init container step-by-step.

### Step 1: Understand the YAML Structure

Every init container is defined in the `initContainers` list within a Pod spec:

```
apiVersion: v1kind: Podmetadata:  name: my-podspec:  initContainers:  - name: init-1    image: busybox    command: ["sh", "-c", "echo 'First init'; sleep 2"]  - name: init-2    image: busybox    command: ["sh", "-c", "echo 'Second init'"]  containers:  - name: app    image: nginx
```

**Key points:**

-   Init containers run in the order defined (init-1 completes before init-2 starts)
-   The app container starts only after ALL init containers complete
-   Init containers use the same image syntax as regular containers

### Step 2: Create a Real Example

Create a file `init-demo.yaml`:

```
apiVersion: v1kind: Podmetadata:  name: db-check-podspec:  initContainers:  - name: check-db    image: alpine    command:    - sh    - -c    - |      echo "Checking database connectivity..."      # Simulate checking database      if [ -f /tmp/db-ready ]; then        echo "✓ Database is ready"        exit 0      else        echo "✗ Database not ready, retrying..."        # In real scenario: loop until connection succeeds        exit 1      fi  containers:  - name: app    image: nginx:alpine    ports:    - containerPort: 80
```

### Step 3: Deploy and Observe

```
$ kubectl apply -f init-demo.yamlpod/db-check-pod created$ kubectl get pod db-check-podNAME           READY   STATUS     RESTARTS   AGEdb-check-pod   0/1     Init:0/1   0          3s
```

**Output shows:**

-   `STATUS: Init:0/1` means "1 init container, 0 completed"
-   Pod is waiting for the init container to finish

```
$ kubectl describe pod db-check-pod...Init Containers:  check-db:    Container ID:  docker://abc123...    Image:         alpine    Image ID:      docker-sha256:def456...    Port:          <none>    Host Port:     <none>    Command:      sh      -c      echo "Checking database connectivity..."...    State:          Waiting      Reason:       CrashLoopBackOff    Last State:     Terminated      Reason:       Error      Exit Code:    1...
```

The init container exits with code 1 (failure). Kubernetes keeps retrying. Let's fix it:

```
# Create the condition the init container checks for$ kubectl exec db-check-pod -- touch /tmp/db-ready 2>/dev/null || echo "Pod not running yet"Pod not running yet# Instead, delete and redeploy with the file pre-existing$ kubectl delete pod db-check-podpod "db-check-pod" deleted
```

Create `init-demo-fixed.yaml` with a conditional that won't fail:

```
apiVersion: v1kind: Podmetadata:  name: db-check-pod-fixedspec:  initContainers:  - name: check-db    image: alpine    command:    - sh    - -c    - |      echo "Checking database connectivity..."      echo "✓ Database is ready"      sleep 1  containers:  - name: app    image: nginx:alpine    ports:    - containerPort: 80
```

```
$ kubectl apply -f init-demo-fixed.yamlpod/db-check-pod-fixed created$ kubectl get pod db-check-pod-fixedNAME                 READY   STATUS    RESTARTS   AGEdb-check-pod-fixed   1/1     Running   0          5s$ kubectl logs db-check-pod-fixedChecking database connectivity...✓ Database is ready
```

**Status progressed to `1/1 Running`** because the init container succeeded.

* * *

## Sharing Data Between Init and App Containers

Init containers are useful for setup, but they're even more powerful when they share data with app containers through volumes.

### Common Pattern: Download Then Use

Create `model-download-init.yaml`:

```
apiVersion: v1kind: Podmetadata:  name: model-loaderspec:  initContainers:  - name: download-model    image: alpine    command:    - sh    - -c    - |      echo "Downloading model..."      # Create a dummy model file (simulate download)      mkdir -p /models      echo '{"version": "1.0", "weights": [...]}' > /models/config.json      echo "Model downloaded to /models/config.json"      ls -lh /models/    volumeMounts:    - name: model-storage      mountPath: /models  containers:  - name: app    image: alpine    command:    - sh    - -c    - |      echo "App starting..."      echo "Available models:"      ls -lh /models/      echo "Model content:"      cat /models/config.json      sleep 3600    volumeMounts:    - name: model-storage      mountPath: /models  volumes:  - name: model-storage    emptyDir: {}
```

**Key points:**

-   Both `initContainers` and `containers` list `volumeMounts` for the same volume
-   The init container writes to `/models`
-   The app container reads from the same `/models`
-   The volume (`emptyDir`) persists data across containers in the same Pod

### Deploy and Verify

```
$ kubectl apply -f model-download-init.yamlpod/model-loader created$ kubectl get pod model-loaderNAME           READY   STATUS    RESTARTS   AGEmodel-loader   1/1     Running   0          8s$ kubectl logs model-loaderApp starting...Available models:total 4-rw-r--r--    1 root     root           57 Jan 15 10:20 config.jsonModel content:{"version": "1.0", "weights": [...]}
```

The init container wrote the file; the app container successfully read it. **This is the pattern you'll use for:**

-   Model download → model loading
-   Database schema setup → app initialization
-   Configuration validation → configuration usage

* * *

## Debugging Init Container Failures

What happens when an init container fails? Kubernetes provides tools to diagnose the problem.

### Scenario: Init Container Fails

Create `init-fail.yaml`:

```
apiVersion: v1kind: Podmetadata:  name: failing-initspec:  initContainers:  - name: validate-config    image: alpine    command:    - sh    - -c    - |      echo "Validating configuration..."      if grep -q "SECRET_KEY" /config/secrets.txt; then        echo "Configuration valid"        exit 0      else        echo "ERROR: SECRET_KEY not found in configuration"        exit 1      fi    volumeMounts:    - name: config      mountPath: /config  containers:  - name: app    image: alpine    command: ["sleep", "3600"]  volumes:  - name: config    emptyDir: {}
```

```
$ kubectl apply -f init-fail.yamlpod/failing-init created$ kubectl get pod failing-initNAME            READY   STATUS    RESTARTS   AGEfailing-init    0/1     Init:0/1  2          10s$ kubectl get pod failing-initNAME            READY   STATUS    RESTARTS   AGEfailing-init    0/1     Init:0/1  3          15s
```

The Pod is stuck restarting because the init container keeps failing.

### Debugging Tool 1: kubectl logs with -c (container name)

```
$ kubectl logs failing-init -c validate-configValidating configuration...ERROR: SECRET_KEY not found in configuration$ kubectl logs failing-init -c validate-config -p# -p flag shows logs from previous init container run if it crashedValidating configuration...ERROR: SECRET_KEY not found in configuration
```

This tells you **why** the init container failed (missing SECRET\_KEY).

### Debugging Tool 2: kubectl describe

```
$ kubectl describe pod failing-initName:             failing-initNamespace:        defaultPriority:         0Node:             docker-desktop/192.168.65.4Start Time:       Mon, 15 Jan 2024 10:25:00 +0000Labels:           <none>Annotations:      <none>Status:           PendingInit Containers:  validate-config:    Container ID:  docker://xyz789...    Image:         alpine    Image ID:      docker-sha256:abc123...    Port:          <none>    Host Port:     <none>    Command:      sh      -c      echo "Validating configuration..."...    State:          Waiting      Reason:       CrashLoopBackOff    Last State:     Terminated      Reason:       Error      Exit Code:    1      Started:      2024-01-15T10:26:45Z      Finished:     2024-01-15T10:26:46Z    Ready:          False    Restart Count:  3    Environment:    <none>    Mounts:      /config from config (rw)      /var/run/secrets/kubernetes.io/serviceaccount from kube-api-access-2q6nx (ro)Events:  Type     Reason     Age   From               Message  ----     ------     ---   From               --------  Normal   Scheduled  30s   default-scheduler  Successfully assigned default/failing-init to docker-desktop  Normal   Created    28s   kubelet            Created container validate-config  Normal   Started    28s   kubelet            Started container validate-config  Normal   BackOff    15s   kubelet            Back-off restarting failed container  Normal   Pulled     10s   kubelet            Container image "alpine:latest" pulled  Normal   Created    9s    kubelet            Created container validate-config  Normal   Started    9s    kubelet            Started container validate-config  Normal   BackOff    3s    kubelet            Back-off restarting failed container
```

**Key diagnostic clues:**

-   `State: Waiting` with `Reason: CrashLoopBackOff` = container keeps failing
-   `Exit Code: 1` = exited with error
-   `Restart Count: 3` = Kubernetes has retried 3 times

### The Fix

The init container is checking for a file that doesn't exist. Either:

1.  **Create the file** (if this should work):
    
    ```
    # Can't exec into failing pod, so create a fixed version instead
    ```
    
2.  **Fix the init container logic**:
    
    ```
    initContainers:- name: validate-config  image: alpine  command:  - sh  - -c  - |    echo "Setting up configuration..."    # Create the required file    mkdir -p /config    echo "SECRET_KEY=my-secret-12345" > /config/secrets.txt    echo "Configuration created"
    ```
    

```
$ kubectl apply -f init-fixed.yamlpod/fixed-init created$ kubectl get pod fixed-initNAME        READY   STATUS    RESTARTS   AGEfixed-init  1/1     Running   0          5s$ kubectl logs fixed-init -c validate-configSetting up configuration...Configuration created
```

Now the init container succeeds, and the Pod moves to `Running`.

* * *

## Advanced Init Container Patterns

### Pattern 1: Sequential Init Containers (Guaranteed Order)

Init containers always run sequentially. Use this when one setup step depends on another:

```
apiVersion: v1kind: Podmetadata:  name: sequential-setupspec:  initContainers:  - name: 1-create-dirs    image: alpine    command: ["mkdir", "-p", "/app/logs", "/app/data"]    volumeMounts:    - name: app-storage      mountPath: /app  - name: 2-verify-config    image: alpine    command:    - sh    - -c    - |      echo "Checking for configuration..."      test -f /config/app.conf      echo "✓ Configuration verified"    volumeMounts:    - name: config      mountPath: /config  - name: 3-download-assets    image: alpine    command:    - sh    - -c    - |      echo "Downloading assets..."      # Download step      echo "✓ Assets ready"    volumeMounts:    - name: app-storage      mountPath: /app  containers:  - name: app    image: myapp:1.0    volumeMounts:    - name: app-storage      mountPath: /app    - name: config      mountPath: /config  volumes:  - name: app-storage    emptyDir: {}  - name: config    emptyDir: {}
```

The three init containers run in order: `1-create-dirs` completes, then `2-verify-config` runs, then `3-download-assets` runs. Only after all three succeed does the `app` container start.

### Pattern 2: Init Container with Retries

Some operations (like network requests) may be transient. Add retry logic to init containers:

```
initContainers:- name: download-with-retries  image: alpine  command:  - sh  - -c  - |    MAX_ATTEMPTS=5    ATTEMPT=0    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do      ATTEMPT=$((ATTEMPT + 1))      echo "Attempt $ATTEMPT/$MAX_ATTEMPTS: Downloading model..."      if wget -q https://models.example.com/model.bin -O /models/model.bin; then        echo "✓ Download successful"        exit 0      fi      if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then        echo "  Retrying in 5 seconds..."        sleep 5      fi    done    echo "✗ Failed after $MAX_ATTEMPTS attempts"    exit 1  volumeMounts:  - name: models    mountPath: /models
```

This init container retries up to 5 times with a 5-second delay between attempts. Kubernetes will also restart the Pod after a delay if all attempts fail.

* * *

## Try With AI

You're deploying a custom computer vision model that requires:

1.  Downloading a 2GB trained model from cloud storage
2.  Extracting it from a tar.gz archive
3.  Verifying the checksum before the app starts
4.  Creating necessary directories with proper permissions

**Setup**: You have the model archive URL and expected SHA256 checksum available as environment variables.

**Your task**: Design an init container that handles all three steps, then configure the main app container to use the downloaded model.

**Specific prompts to try**:

1.  "Design an init container YAML that downloads a 2GB model archive from `s3://models-bucket/vision-model.tar.gz`, extracts it to `/models`, and verifies the checksum is `abc123...`"
    
2.  "Show me how to configure volume sharing so the app container (running a FastAPI service) can access the extracted model files at `/models/weights/`"
    
3.  "What happens if the checksum verification fails? How should the init container handle this so Kubernetes knows to restart the Pod?"
    
4.  "Write the complete Pod YAML combining the init container with a FastAPI app container that expects the model at `/models/weights/model.onnx`"
    

After you get responses, consider:

-   What if the model download times out? How would you add retry logic to the init container command?
-   How would you monitor how long the init phase takes before the app container starts?
-   Could you use a ConfigMap to inject the model URL and checksum rather than hardcoding them?

Checking access...

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 50: Kubernetes for AI Services](/docs/AI-Cloud-Native-Development/kubernetes-for-ai-services)
-   Sidecar Containers (Optional)

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/50-kubernetes-for-ai-services/17-sidecar-containers-optional.md)

# Sidecar Containers: The Agent's Best Friend

You've deployed your agent to Kubernetes. Requests arrive. Your agent handles them. But where do the logs go? Where's the monitoring data? How do you trace which request took how long?

Traditional single-container deployments mix your application logic with logging, monitoring, and debugging concerns. Your agent code becomes cluttered. Operational concerns become tangled with business logic. Testing gets harder.

**Sidecars** solve this. A sidecar is a helper container that runs alongside your main application container—in the same Pod, sharing the same network and storage. Your agent focuses on its job. The sidecar handles logging, metrics, proxying, or security concerns independently. They coordinate through shared volumes and localhost networking.

This lesson teaches you to design and deploy sidecars using Kubernetes' native sidecar support (available since Kubernetes 1.28). By the end, you'll deploy an agent with a logging sidecar and a metrics sidecar, keeping operational concerns separated from application logic.

* * *

## The Sidecar Pattern: Separation of Concerns

### The Problem: Tangled Concerns

Imagine your FastAPI agent needs to:

1.  Handle incoming requests
2.  Write structured logs to a file
3.  Expose Prometheus metrics
4.  Trace request latency

If all this logic lives in one container, your code becomes messy:

```
@app.post("/inference")async def inference(request: Request):    # Business logic    result = model.predict(request.text)    # Logging concern    with open("/var/log/requests.log", "a") as f:        f.write(json.dumps({"request": request.text, "result": result}))    # Metrics concern    inference_counter.inc()    inference_latency.observe(time.time() - start)    # Return result    return {"prediction": result}
```

Your application code is entangled with operational concerns. Testing requires mocking file I/O and metrics. Scaling requires coordinating all concerns together.

### The Solution: Sidecars

Instead, separate concerns into independent containers:

```
┌──────────────────────────────────────────────────┐│             Pod (Shared Network)                 │├──────────────────────┬──────────────────────────┤│                      │                          ││  Main Container      │  Logging Sidecar         ││  (FastAPI Agent)     │                          ││                      │  - Reads /var/log/agent  ││  @app.post("/")      │  - Streams to stdout     ││  Handle requests     │  - Or sends to central   ││                      │    logging system        ││                      │                          │├──────────────────────┼──────────────────────────┤│  Metrics Sidecar     │  Proxy Sidecar           ││                      │  (Optional)              ││  - Scrapes metrics   │                          ││  - Exposes on :9090  │  - TLS termination       ││                      │  - Service mesh inject   ││                      │  - Request routing       │└──────────────────────┴──────────────────────────┘      Shared Volume (/var/log)      Shared Network (localhost)
```

Your agent writes logs to `/var/log/agent/requests.log`. The logging sidecar watches that file and streams it to a central logging service. Your agent exposes metrics on `localhost:8000/metrics`. A metrics sidecar scrapes and forwards those metrics.

Each container has one job. Testing is simpler. Scaling is predictable.

* * *

## Native Sidecars: Kubernetes 1.28+

Before Kubernetes 1.28, sidecars were regular containers in the `containers` field, but Kubernetes couldn't distinguish them from the main application container. This created ambiguity about startup ordering and lifecycle.

Kubernetes 1.28 introduced the `initContainers` field with a new `restartPolicy: Always` option specifically for sidecars:

### How It Works

1.  **Init containers with `restartPolicy: Always`** start before main containers
2.  They run continuously (unlike traditional init containers that exit after setup)
3.  If a sidecar crashes, Kubernetes restarts it independently
4.  Main container startup is NOT blocked by sidecar readiness

This guarantees:

-   Sidecars are ready before main application starts processing requests
-   Sidecars stay alive throughout the Pod's lifetime
-   Main container failures don't restart sidecars unnecessarily

* * *

## Concept 1: Writing Logs to Shared Volumes

Your agent and sidecars must communicate. The most reliable method: **shared volumes**.

Create a Pod with:

-   Main container: Writes logs to `/var/log/agent/`
-   Logging sidecar: Reads from `/var/log/agent/`, streams to stdout or external service

### Step 1: Create Agent with Log Volume

Create `agent-with-logging.yaml`:

```
apiVersion: v1kind: Podmetadata:  name: agent-with-loggingspec:  containers:  - name: agent    image: myregistry.azurecr.io/agent:v1    ports:    - containerPort: 8000    volumeMounts:    - name: log-volume      mountPath: /var/log/agent    env:    - name: LOG_FILE      value: /var/log/agent/requests.log  initContainers:  - name: logging-sidecar    image: fluent/fluent-bit:latest    restartPolicy: Always  # <-- Native sidecar: Always restarts    volumeMounts:    - name: log-volume      mountPath: /var/log/agent    args:    - -c    - /fluent-bit/etc/fluent-bit.conf  volumes:  - name: log-volume    emptyDir: {}
```

Key points:

-   **emptyDir**: Temporary storage, shared across containers in the Pod
-   **volumeMounts**: Both containers mount the same volume at `/var/log/agent`
-   **initContainers with restartPolicy: Always**: Logging sidecar starts before agent and stays running

Deploy it:

```
kubectl apply -f agent-with-logging.yaml
```

**Output:**

```
pod/agent-with-logging created
```

Verify the Pod is running:

```
kubectl get pods
```

**Output:**

```
NAME                   READY   STATUS    RESTARTS   AGEagent-with-logging     2/2     Running   0          5s
```

The `2/2` shows both containers are ready. Without the sidecar, you'd see `1/1`.

### Step 2: Verify Log Volume Sharing

Exec into the agent container and create a test log:

```
kubectl exec -it agent-with-logging -c agent -- sh
```

Inside the container:

```
echo '{"request": "test", "result": "success"}' >> /var/log/agent/requests.logcat /var/log/agent/requests.log
```

**Output:**

```
{"request": "test", "result": "success"}
```

Exit:

```
exit
```

Now exec into the logging sidecar and read the same file:

```
kubectl exec -it agent-with-logging -c logging-sidecar -- sh
```

Inside the sidecar:

```
cat /var/log/agent/requests.log
```

**Output:**

```
{"request": "test", "result": "success"}
```

Both containers see the same logs. The sidecar can now stream this data to a centralized logging service (e.g., Elasticsearch, Splunk, or Stackdriver).

* * *

## Concept 2: Multi-Sidecar Pod with Metrics

Most production Pods run multiple sidecars. Let's add a metrics sidecar alongside logging.

Create `agent-with-logging-and-metrics.yaml`:

```
apiVersion: v1kind: Podmetadata:  name: agent-with-sidecarsspec:  containers:  - name: agent    image: myregistry.azurecr.io/agent:v1    ports:    - containerPort: 8000      name: http    - containerPort: 8001      name: metrics  # <-- Agent exposes metrics here    volumeMounts:    - name: log-volume      mountPath: /var/log/agent    env:    - name: LOG_FILE      value: /var/log/agent/requests.log  initContainers:  - name: logging-sidecar    image: fluent/fluent-bit:latest    restartPolicy: Always    volumeMounts:    - name: log-volume      mountPath: /var/log/agent  - name: metrics-sidecar    image: prom/prometheus:latest    restartPolicy: Always    ports:    - containerPort: 9090      name: prometheus    volumeMounts:    - name: prometheus-config      mountPath: /etc/prometheus    args:    - --config.file=/etc/prometheus/prometheus.yml  volumes:  - name: log-volume    emptyDir: {}  - name: prometheus-config    configMap:      name: prometheus-config
```

Deploy:

```
kubectl apply -f agent-with-logging-and-metrics.yaml
```

**Output:**

```
pod/agent-with-sidecars created
```

Check Pod status:

```
kubectl get pods
```

**Output:**

```
NAME                     READY   STATUS    RESTARTS   AGEagent-with-sidecars      3/3     Running   0          8s
```

Three containers running in one Pod: agent, logging sidecar, metrics sidecar. All share the Pod's network namespace, so the metrics sidecar can reach the agent's metrics endpoint at `localhost:8001/metrics` without any network configuration.

* * *

## Concept 3: Sidecar Lifecycle and Ordering

### Init Containers with restartPolicy: Always

When you use `initContainers` with `restartPolicy: Always`, Kubernetes guarantees:

1.  **Startup order**: Init containers start BEFORE main containers
2.  **Independence**: Each init container runs to completion before the next starts
3.  **Restart behavior**: If an init container crashes, it restarts (not the entire Pod)
4.  **Main container waits**: Main containers don't start until all init containers are healthy

This is different from:

-   **Traditional init containers** (`restartPolicy: OnFailure` or default): Run once, exit, never restart
-   **Regular containers**: Can be restarted independently, but don't block main container startup

### Example: Startup Sequence

```
Time 0:    Pod created           └─ Init container 1 (logging-sidecar) startsTime 1:    Logging sidecar ready           └─ Init container 2 (metrics-sidecar) startsTime 2:    Metrics sidecar ready           └─ Main container (agent) startsTime 3:    Agent running, processing requests           └─ All sidecars handle logging/metrics independentlyTime 10:   Metrics sidecar crashes           └─ Kubernetes immediately restarts it           └─ Agent continues running (unaffected)Time 15:   Metrics sidecar recovered           └─ Continues scraping metrics from agent
```

This ordering prevents race conditions where the agent starts before sidecars are ready.

### Shutdown Sequence

When a Pod terminates:

```
Time 0:    Pod receives termination signal           └─ All containers receive SIGTERMTime 0-30: Containers have grace period to shut down           └─ Agent stops accepting requests           └─ Sidecars flush any buffered data           └─ Connections close gracefullyTime 30:   Grace period expires           └─ Kubernetes sends SIGKILL           └─ Pod and all containers terminated
```

All containers terminate together, which is why sidecars (not separate sidecar Pods) are essential—they share the Pod's lifecycle.

* * *

## Practical Configuration: Logging Sidecar for Agent Inference

Let's build a realistic logging sidecar for your agent. Your agent logs inference requests and latencies. The sidecar streams these to stdout for collection.

Create `agent-inference-logging.yaml`:

```
apiVersion: v1kind: Podmetadata:  name: agent-inference-loggerspec:  containers:  - name: agent    image: myregistry.azurecr.io/agent:v1    ports:    - containerPort: 8000    volumeMounts:    - name: logs      mountPath: /var/log/agent    env:    - name: LOG_FILE      value: /var/log/agent/inference.log  initContainers:  - name: log-collector    image: fluent/fluent-bit:latest    restartPolicy: Always    volumeMounts:    - name: logs      mountPath: /var/log/agent    - name: fluent-config      mountPath: /fluent-bit/etc    args:    - -c    - /fluent-bit/etc/fluent-bit.conf  volumes:  - name: logs    emptyDir: {}  - name: fluent-config    configMap:      name: fluent-bit-config
```

Deploy:

```
kubectl apply -f agent-inference-logging.yaml
```

**Output:**

```
pod/agent-inference-logger created
```

View logs from the sidecar:

```
kubectl logs agent-inference-logger -c log-collector
```

**Output:**

```
[2025-12-22 14:35:12.123] [info] [fluent-bit] version 2.1.0, commit hash: abc1234[2025-12-22 14:35:12.234] [info] starting log collection from /var/log/agent/inference.log[2025-12-22 14:35:23.456] [info] collected: {"request_id": "abc123", "latency_ms": 245, "status": "success"}[2025-12-22 14:35:45.789] [info] collected: {"request_id": "def456", "latency_ms": 198, "status": "success"}
```

The sidecar reads and streams logs, which Kubernetes collects and makes available via `kubectl logs`.

* * *

## Try With AI

Open a terminal and work through these scenarios with an AI assistant's help:

### Scenario 1: Design a Logging Sidecar

**Your task:** Design a Pod manifest where:

-   Main container: A Python FastAPI agent running on port 8000
-   Sidecar: Fluent Bit collecting logs from `/var/log/agent/requests.log` and forwarding to an external logging service (e.g., Datadog or CloudWatch)

Ask AI: "Create a Pod manifest with a FastAPI agent and a Fluent Bit sidecar that collects logs and forwards them to \[your logging service\]."

Review AI's response:

-   Is the sidecar configured as an init container with `restartPolicy: Always`?
-   Do both containers mount the same log volume?
-   Is the Fluent Bit configuration correct for your logging service?
-   Are environment variables set correctly for API keys or endpoints?

Tell AI: "The logging service requires authentication. I need to pass credentials securely."

Ask: "Update the manifest to inject credentials using a Kubernetes Secret."

**Reflection:**

-   How does the sidecar access the Secret?
-   What would break if the logging service becomes unavailable?
-   Could you test this locally with Docker Desktop Kubernetes?

### Scenario 2: Multi-Sidecar Deployment

**Your task:** Your agent now needs:

1.  Logging sidecar (Fluent Bit)
2.  Metrics sidecar (Prometheus)
3.  Security sidecar (mTLS termination with Linkerd or Istio)

Ask AI: "Create a Pod manifest with three sidecars: logging, metrics, and security. Explain the startup and shutdown ordering."

AI might suggest:

-   All sidecars as init containers with `restartPolicy: Always`
-   Separate ConfigMaps for each sidecar's configuration
-   Shared volumes for log files, shared network for metrics scraping

Ask: "What happens if the metrics sidecar crashes? Will my agent stop handling requests?"

**Reflection:**

-   Why are sidecars better than separate Pods?
-   How would you test sidecar failures locally?
-   What's the memory and CPU cost of adding a third sidecar?

### Scenario 3: Troubleshoot Sidecar Failures

**Your task:** You deployed a Pod with an agent and logging sidecar. The Pod shows `2/2 READY`, but logs aren't being collected. The Fluent Bit sidecar is healthy, but no data is appearing in your logging service.

Ask AI: "My logging sidecar is running but not collecting logs. The agent container is writing to `/var/log/agent/requests.log`. What could be wrong?"

AI might suggest:

-   Verify the volume mount path is correct
-   Check Fluent Bit configuration syntax
-   Confirm the logging service credentials are valid
-   Inspect Fluent Bit logs with `kubectl logs -c logging-sidecar`

Ask: "Show me the exact kubectl commands to debug this."

**Reflection:**

-   What would you look for in the sidecar logs?
-   How would you verify the agent is actually writing to the shared volume?
-   Could a permissions issue prevent the sidecar from reading the log file?

Checking access...

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 50: Kubernetes for AI Services](/docs/AI-Cloud-Native-Development/kubernetes-for-ai-services)
-   Ingress: External Access (Optional)

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/50-kubernetes-for-ai-services/18-ingress-optional.md)

# Ingress: Exposing Your Agent to the World

Your agent running in Kubernetes handles thousands of requests. But how does traffic reach it? In Lesson 5, you learned about Services—the stable interfaces to your Pods. LoadBalancer Services work well for simple cases, but production systems need something more powerful: **Ingress**.

Ingress lets you expose HTTP and HTTPS routes from outside the cluster to services within it. Unlike LoadBalancer, which creates a cloud load balancer for every service (expensive), Ingress shares one load balancer across multiple services. You can route requests based on hostname, URL path, or both. You can terminate TLS for HTTPS. You can even implement A/B testing by routing different traffic percentages to different versions of your agent.

Think of it this way: LoadBalancer is a direct tunnel to one service. Ingress is an intelligent receptionist—it looks at your request, reads the address and directions, and routes you to the right department.

## Why LoadBalancer Isn't Enough

**The Cost Problem**

Every LoadBalancer Service you create provisions a cloud load balancer. On AWS, that's $16/month per load balancer. With 10 services, you're paying $160/month just for load balancers. Ingress shares one load balancer across all services—one $16/month bill instead of ten.

**The Feature Gap**

LoadBalancer gives you Layer 4 routing (TCP/UDP based on port). It knows nothing about HTTP. Ingress gives you Layer 7 routing:

-   Route `/api/v1/` requests to the stable agent version
-   Route `/api/v2/beta/` requests to the experimental agent
-   Route `dashboard.example.com` to monitoring, `api.example.com` to your agent
-   Terminate TLS for HTTPS
-   Implement request rewriting
-   Control access with rate limiting

**The Management Problem**

With LoadBalancer, every service is exposed separately. You're managing multiple external IPs, each with different security rules. With Ingress, you have one entrypoint—one place to manage TLS certificates, one place to enforce security policies.

## Ingress Architecture: Controller and Resource

Ingress has two parts: a **resource** (declarative specification) and a **controller** (the process that implements it).

### The Ingress Resource

The Ingress resource is a Kubernetes API object—like Deployment or Service. It specifies your desired routing rules:

```
apiVersion: networking.k8s.io/v1kind: Ingressmetadata:  name: agent-ingressspec:  ingressClassName: nginx  rules:  - host: api.example.com    http:      paths:      - path: /api/v1/        backend:          service:            name: agent-stable            port:              number: 8000      - path: /api/v2/beta/        backend:          service:            name: agent-experimental            port:              number: 8000
```

This says: "Listen on api.example.com, route requests to `/api/v1/` to the agent-stable service, route requests to `/api/v2/beta/` to the agent-experimental service."

The resource is just a specification. It does nothing by itself.

### The Ingress Controller

The **Ingress controller** reads Ingress resources and implements them. It's a Pod running in your cluster that watches for Ingress resources, then configures a real load balancer (nginx, HAProxy, cloud provider's LB) to actually route traffic.

Popular controllers:

-   **nginx-ingress** (open source, works everywhere)
-   **AWS ALB** (AWS-native, integrates with ELBv2)
-   **GCP Cloud Armor** (GCP-native)
-   **Kong** (commercial-grade API gateway)

For this chapter, we'll use nginx-ingress because it works on Docker Desktop, cloud clusters, and on-premises Kubernetes.

## Installing nginx-ingress on Docker Desktop

Install nginx-ingress using kubectl:

```
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
```

**Output:**

```
namespace/ingress-nginx createdserviceaccount/ingress-nginx created...deployment.apps/ingress-nginx-controller created
```

Verify the controller is running:

```
kubectl get pods -n ingress-nginx
```

**Output:**

```
NAMESPACE       NAME                                       READY   STATUS    RESTARTS   AGEingress-nginx   ingress-nginx-admission-patch-xxxxx        0/1     Completed   0          2mingress-nginx   ingress-nginx-admission-create-xxxxx       0/1     Completed   0          2mingress-nginx   ingress-nginx-controller-yyyyy             1/1     Running     0          2m
```

The `ingress-nginx-controller` is the daemon watching your cluster for Ingress resources. When you create an Ingress, this controller reads it and configures nginx to route traffic accordingly.

Check which IngressClass is available:

```
kubectl get ingressclasses
```

**Output:**

```
NAME    CONTROLLER                       AGEnginx   k8s.io/ingress-nginx/nginx       2m
```

The `nginx` IngressClass is your controller. When you create an Ingress with `ingressClassName: nginx`, this controller takes responsibility for implementing it.

## Path-Based Routing: Versioned APIs

Your agent has evolved. You have a stable `/api/v1/` endpoint that clients rely on, and a new `/api/v2/beta/` endpoint with experimental features. Different Deployments run each version:

```
kubectl create deployment agent-v1 --image=your-registry/agent:v1 --replicas=2kubectl create deployment agent-v2 --image=your-registry/agent:v2 --replicas=1
```

**Output:**

```
deployment.apps/agent-v1 createddeployment.apps/agent-v2 created
```

Expose each as a Service:

```
kubectl expose deployment agent-v1 --port=8000 --target-port=8000 --name=agent-v1-servicekubectl expose deployment agent-v2 --port=8000 --target-port=8000 --name=agent-v2-service
```

**Output:**

```
service/agent-v1-service exposedservice/agent-v2-service exposed
```

Verify both services exist:

```
kubectl get svc | grep agent
```

**Output:**

```
NAME                TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)agent-v1-service   ClusterIP   10.96.200.50    <none>        8000/TCPagent-v2-service   ClusterIP   10.96.201.100   <none>        8000/TCP
```

Now create an Ingress to route traffic to both:

```
apiVersion: networking.k8s.io/v1kind: Ingressmetadata:  name: agent-path-routingspec:  ingressClassName: nginx  rules:  - host: localhost  # For Docker Desktop testing    http:      paths:      - path: /api/v1        pathType: Prefix        backend:          service:            name: agent-v1-service            port:              number: 8000      - path: /api/v2/beta        pathType: Prefix        backend:          service:            name: agent-v2-service            port:              number: 8000
```

Save as `agent-path-routing.yaml` and apply:

```
kubectl apply -f agent-path-routing.yaml
```

**Output:**

```
ingress.networking.k8s.io/agent-path-routing created
```

Verify the Ingress is configured:

```
kubectl get ingress
```

**Output:**

```
NAME                   CLASS   HOSTS      ADDRESS        PORTS   AGEagent-path-routing     nginx   localhost  192.168.49.2   80      10s
```

The ADDRESS is your localhost. Wait a moment for nginx to configure, then test:

```
curl http://localhost/api/v1/health
```

**Output:**

```
{"status": "healthy", "version": "1.0"}
```

```
curl http://localhost/api/v2/beta/health
```

**Output:**

```
{"status": "healthy", "version": "2.0-beta", "experimental": true}
```

The same Ingress gateway routes `/api/v1` and `/api/v2/beta` to different backend services. This is the power of path-based routing—one IP, multiple APIs, each backed by independent Deployments.

## Host-Based Routing: Multiple Domains

Your team operates multiple services from one cluster:

-   `agent.example.com` — Your AI agent API
-   `dashboard.example.com` — Monitoring dashboard
-   `webhook.example.com` — Event receiver

Each has its own Service. Host-based Ingress routes traffic to the right Service based on the hostname:

```
apiVersion: networking.k8s.io/v1kind: Ingressmetadata:  name: agent-host-routingspec:  ingressClassName: nginx  rules:  - host: agent.example.com    http:      paths:      - path: /        pathType: Prefix        backend:          service:            name: agent-service            port:              number: 8000  - host: dashboard.example.com    http:      paths:      - path: /        pathType: Prefix        backend:          service:            name: dashboard-service            port:              number: 3000  - host: webhook.example.com    http:      paths:      - path: /        pathType: Prefix        backend:          service:            name: webhook-service            port:              number: 5000
```

Apply this configuration:

```
kubectl apply -f agent-host-routing.yaml
```

**Output:**

```
ingress.networking.k8s.io/agent-host-routing created
```

Verify the Ingress configuration:

```
kubectl get ingress agent-host-routing -o wide
```

**Output:**

```
NAME                   CLASS   HOSTS                                          ADDRESS        PORTS   AGEagent-host-routing     nginx   agent.example.com,dashboard.example.com,...   192.168.49.2   80      30s
```

Test locally by modifying `/etc/hosts` (or adding entries to your DNS):

```
echo "192.168.49.2 agent.example.com dashboard.example.com webhook.example.com" >> /etc/hostscat /etc/hosts | tail -1
```

**Output:**

```
192.168.49.2 agent.example.com dashboard.example.com webhook.example.com
```

Then test each hostname:

```
curl http://agent.example.com/health
```

**Output:**

```
{"status": "healthy", "service": "agent", "uptime_seconds": 3600}
```

```
curl http://dashboard.example.com/
```

**Output:**

```
<html>Dashboard - 12 agents online, 0 errors</html>
```

The same Ingress controller routes three different hostnames to three different services. This is the foundation of multi-tenant deployments—one gateway, many applications.

## TLS Termination for HTTPS

Internet traffic should be encrypted. Kubernetes TLS termination means the Ingress handles encryption/decryption, so backend services communicate in plain HTTP internally (they're protected by the network).

### Create a Self-Signed Certificate (for testing)

```
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \  -keyout /tmp/tls.key \  -out /tmp/tls.crt \  -subj "/CN=agent.example.com"
```

**Output:**

```
Generating a RSA private key...................................................+++++Generating a self signed certificate...
```

### Create a TLS Secret

Kubernetes stores certificates in Secrets. Create one with your TLS key and certificate:

```
kubectl create secret tls agent-tls \  --cert=/tmp/tls.crt \  --key=/tmp/tls.key
```

**Output:**

```
secret/agent-tls created
```

Verify the secret:

```
kubectl get secret agent-tls
```

**Output:**

```
NAME         TYPE                DATA   AGEagent-tls    kubernetes.io/tls   2      5s
```

### Update Ingress with TLS

Modify your Ingress to reference the TLS secret:

```
apiVersion: networking.k8s.io/v1kind: Ingressmetadata:  name: agent-tls-ingressspec:  ingressClassName: nginx  tls:  - hosts:    - agent.example.com    secretName: agent-tls  rules:  - host: agent.example.com    http:      paths:      - path: /        pathType: Prefix        backend:          service:            name: agent-service            port:              number: 8000
```

Apply:

```
kubectl apply -f agent-tls-ingress.yaml
```

**Output:**

```
ingress.networking.k8s.io/agent-tls-ingress created
```

Test HTTPS:

```
curl --insecure https://agent.example.com/health
```

**Output:**

```
{"status": "healthy", "tls": "yes"}
```

(We use `--insecure` because the self-signed certificate isn't in your system's trust store. In production, you'd use a certificate from a trusted CA like Let's Encrypt.)

The Ingress controller (nginx) terminates TLS—it decrypts incoming HTTPS traffic and routes requests to your services over plain HTTP. This simplifies certificate management (one place to update certs) and reduces computational burden on your agent services.

Verify the TLS secret is mounted correctly:

```
kubectl describe ingress agent-tls-ingress
```

**Output:**

```
Name:             agent-tls-ingressNamespace:        defaultAddress:          192.168.49.2Default backend:  default-http-backend:80 (<error: endpoints "default-http-backend" not found>)TLS:  agent-tls terminates agent.example.comRules:  Host                   Path  Backends  ----                   ----  --------  agent.example.com                         /     agent-service:8000 (10.244.0.10:8000,10.244.0.11:8000)Annotations:  <none>Events:                  <none>
```

The TLS configuration is active. The nginx controller has loaded your certificate and key from the `agent-tls` secret.

## A/B Testing with Traffic Splitting

Your team wants to validate a new agent version with 10% of traffic while keeping 90% on the stable version. You can't do this with basic routing—you need **weighted traffic splitting**.

Create two Services:

```
kubectl create deployment agent-stable --image=agent:v1.0 --replicas=9kubectl create deployment agent-test --image=agent:v2.0-rc1 --replicas=1kubectl expose deployment agent-stable --port=8000 --name=agent-stablekubectl expose deployment agent-test --port=8000 --name=agent-test
```

**Output:**

```
deployment.apps/agent-stable createddeployment.apps/agent-test createdservice/agent-stable exposedservice/agent-test exposed
```

With nginx-ingress, you can use the `nginx.ingress.kubernetes.io/service-weights` annotation:

```
apiVersion: networking.k8s.io/v1kind: Ingressmetadata:  name: agent-canary  annotations:    nginx.ingress.kubernetes.io/service-weights: |      agent-stable: 90      agent-test: 10spec:  ingressClassName: nginx  rules:  - host: api.example.com    http:      paths:      - path: /        pathType: Prefix        backend:          service:            name: agent-stable            port:              number: 8000
```

Apply:

```
kubectl apply -f agent-canary.yaml
```

**Output:**

```
ingress.networking.k8s.io/agent-canary created
```

Send 100 requests and observe traffic distribution:

```
for i in {1..100}; do curl http://api.example.com/version; done | sort | uniq -c
```

**Output:**

```
      90 {"version": "1.0", "stable": true}      10 {"version": "2.0-rc1", "canary": true}
```

Roughly 90% reach the stable version, 10% reach the test version. This lets you validate new code with real traffic before full rollout.

## Ingress Annotations: Advanced Configuration

Annotations let you customize Ingress behavior without changing the core specification. Common annotations for nginx-ingress:

### Rate Limiting

Protect your agent from being overwhelmed by limiting requests per client:

```
apiVersion: networking.k8s.io/v1kind: Ingressmetadata:  name: agent-rate-limited  annotations:    nginx.ingress.kubernetes.io/limit-rps: "100"    nginx.ingress.kubernetes.io/limit-connections: "10"spec:  ingressClassName: nginx  rules:  - host: api.example.com    http:      paths:      - path: /        pathType: Prefix        backend:          service:            name: agent-service            port:              number: 8000
```

Apply and test:

```
kubectl apply -f agent-rate-limited.yaml
```

**Output:**

```
ingress.networking.k8s.io/agent-rate-limited created
```

Verify the annotations are applied:

```
kubectl get ingress agent-rate-limited -o jsonpath='{.metadata.annotations}'
```

**Output:**

```
{"nginx.ingress.kubernetes.io/limit-connections":"10","nginx.ingress.kubernetes.io/limit-rps":"100"}
```

### CORS Headers

Allow browser clients from specific origins to call your agent:

```
apiVersion: networking.k8s.io/v1kind: Ingressmetadata:  name: agent-cors  annotations:    nginx.ingress.kubernetes.io/enable-cors: "true"    nginx.ingress.kubernetes.io/cors-allow-origin: "https://dashboard.example.com"    nginx.ingress.kubernetes.io/cors-allow-methods: "GET, POST, PUT"spec:  ingressClassName: nginx  rules:  - host: api.example.com    http:      paths:      - path: /        pathType: Prefix        backend:          service:            name: agent-service            port:              number: 8000
```

Apply:

```
kubectl apply -f agent-cors.yaml
```

**Output:**

```
ingress.networking.k8s.io/agent-cors created
```

## Debugging Ingress Issues

When routing fails, use these kubectl commands to diagnose:

### Check Ingress Status

```
kubectl get ingress
```

**Output:**

```
NAME              CLASS   HOSTS              ADDRESS        PORTS   AGEagent-ingress     nginx   api.example.com    192.168.49.2   80      5m
```

If ADDRESS is `<none>`, the ingress controller hasn't assigned an IP yet (usually means services don't exist).

### Describe Ingress Details

```
kubectl describe ingress agent-ingress
```

**Output:**

```
Name:             agent-ingressNamespace:        defaultAddress:          192.168.49.2Ingress Class:    nginxHost(s)           Path  Backends----              ----  --------api.example.com                  /api/v1    agent-v1-service:8000                  /api/v2    agent-v2-service:8000Annotations:      <none>Events:  Type    Reason  Age   From                      Message  ----    ------  ----  ----                      -------  Normal  Sync    30s   nginx-ingress-controller  Scheduled for sync
```

This shows exactly what rules are configured and which backends they target.

### Check Controller Logs

```
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx -f
```

**Output (example):**

```
I1222 10:45:23.123456   12345 main.go:104] Starting NGINX Ingress ControllerI1222 10:45:24.234567   12345 store.go:123] Found Ingress api.example.comI1222 10:45:25.345678   12345 controller.go:456] Sync: agent-ingressI1222 10:45:26.456789   12345 template.go:789] Generating NGINX config
```

Logs show when the controller detects new Ingress resources and updates its configuration.

### Test Connectivity

If the Ingress won't route traffic, verify the backend Service:

```
kubectl port-forward svc/agent-v1-service 8000:8000
```

In another terminal:

```
curl http://localhost:8000/health
```

**Output:**

```
{"status": "healthy", "version": "1.0"}
```

If this works but Ingress routing doesn't, the problem is in the Ingress controller configuration, not the Service.

### Common Issues and Solutions

**Issue: "Service not found" errors in Ingress**

Check the Service exists in the correct namespace:

```
kubectl get svc agent-v1-service
```

**Output:**

```
NAME                TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)agent-v1-service    ClusterIP   10.96.200.50    <none>        8000/TCP
```

**Issue: 503 Service Unavailable**

The Ingress exists but backends are unhealthy:

```
kubectl describe svc agent-v1-service
```

**Output:**

```
Name:              agent-v1-serviceEndpoints:         10.244.0.10:8000,10.244.0.11:8000
```

If Endpoints is empty, Pods aren't running or labels don't match.

## Try With AI

**Setup**: You have two agent services running in your cluster: `chat-agent` and `tool-agent`. Both listen on port 8000. You want to expose them via Ingress so:

-   `http://api.example.com/chat/*` routes to `chat-agent`
-   `http://api.example.com/tools/*` routes to `tool-agent`
-   Both should be accessible over HTTPS using a self-signed certificate

**Part 1: Ask AI for the Ingress design**

Prompt AI:

```
I have two Kubernetes services:- chat-agent (port 8000)- tool-agent (port 8000)I need an Ingress that:1. Routes /chat/* to chat-agent2. Routes /tools/* to tool-agent3. Uses HTTPS with a TLS secret named "api-tls"4. Uses nginx-ingress controllerDesign the Ingress YAML that accomplishes this. What decisions did you make about pathType, backend configuration, and TLS placement?
```

**Part 2: Evaluate the design**

Review AI's response. Ask yourself:

-   Does each path rule specify correct service and port?
-   Is the TLS configuration in the spec.tls section?
-   Did AI explain why certain pathTypes (Exact vs Prefix) were chosen?
-   Are both hosts unified under one Ingress or separate Ingresses?

**Part 3: Test the design**

Create the services (if not already running):

```
kubectl create deployment chat-agent --image=your-registry/chat-agent:latestkubectl create deployment tool-agent --image=your-registry/tool-agent:latestkubectl expose deployment chat-agent --port=8000 --name=chat-agentkubectl expose deployment tool-agent --port=8000 --name=tool-agent
```

Create the TLS secret:

```
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \  -keyout /tmp/api.key -out /tmp/api.crt -subj "/CN=api.example.com"kubectl create secret tls api-tls --cert=/tmp/api.crt --key=/tmp/api.key
```

Apply AI's Ingress:

```
kubectl apply -f ingress.yaml  # The YAML AI generated
```

Test routing:

```
curl --insecure https://api.example.com/chat/hellocurl --insecure https://api.example.com/tools/list
```

**Part 4: Refinement**

If routing works:

-   What annotations might improve this Ingress (rate limiting, CORS handling)?
-   How would you add health checks to ensure failed backends are removed?

If routing fails:

-   Check logs: `kubectl logs -n ingress-nginx <ingress-controller-pod>`
-   Verify services exist: `kubectl get svc`
-   Test Service connectivity directly: `kubectl port-forward svc/chat-agent 8000:8000`
-   Verify TLS secret: `kubectl get secret api-tls`

**Part 5: Compare to your design**

When you started, you might have created separate Ingresses per service. Look at AI's consolidated design:

-   Why is one Ingress cleaner than two?
-   What shared configuration (TLS, IngressClass) benefits from consolidation?
-   When would you split into multiple Ingresses (different namespaces, different IngressClasses)?

Checking access...

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 50: Kubernetes for AI Services](/docs/AI-Cloud-Native-Development/kubernetes-for-ai-services)
-   Service Discovery Deep Dive (Optional)

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/50-kubernetes-for-ai-services/19-service-discovery-optional.md)

# Service Discovery Deep Dive

You've learned how Services provide stable IP addresses to dynamic Pods. But what happens when Agent A in `agents` namespace tries calling Agent B's API in `services` namespace and gets "host not found"? The answer lies in Kubernetes DNS.

Service discovery is the mechanism that translates service names (like `api.services.svc.cluster.local`) into IP addresses. When DNS resolution fails, entire microservices architectures collapse. In this lesson, you'll build mental models of how Kubernetes DNS works, then debug common connectivity failures systematically.

* * *

## The Service Discovery Problem: "Host Not Found"

Imagine this scenario:

Your agent in `agents` namespace calls the API service in `services` namespace:

```
kubectl run -it agent-debug --image=curlimages/curl --rm -- \  curl http://api.services/health
```

**Output:**

```
curl: (6) Could not resolve host: api.services
```

Why? The agent can't find the service. The full name exists—`api.services.svc.cluster.local`—but without understanding Kubernetes DNS architecture, you're debugging blind.

* * *

## How Kubernetes DNS Works: CoreDNS Architecture

Kubernetes doesn't use external DNS for internal service discovery. Instead, every cluster runs CoreDNS—a DNS server that understands Kubernetes services and translates names to IP addresses.

### The DNS Chain

When a Pod requests `api.services`:

```
1. Pod queries localhost:53 (DNS resolver in container)2. Resolver forwards to kube-dns service (Cluster IP: 10.96.0.10)3. CoreDNS pod answers using cluster's service records4. IP address returned to Pod
```

**Key insight**: CoreDNS is itself deployed as a Pod (or Pods) in the `kube-system` namespace, managed by a Deployment:

```
kubectl get pods -n kube-system -l k8s-app=kube-dns
```

**Output:**

```
NAME                    READY   STATUS    RESTARTS   AGEcoredns-7db6d8ff4c      1/1     Running   0          3dcoredns-7db6d8ff4d      1/1     Running   0          3d
```

CoreDNS runs as multiple replicas for redundancy. Each CoreDNS pod watches the Kubernetes API for Service changes and automatically updates DNS records.

* * *

## DNS Naming Hierarchy: FQDN Explained

Every service in Kubernetes has a Fully Qualified Domain Name (FQDN). Understanding this hierarchy is critical for cross-namespace discovery.

### The FQDN Structure

```
service.namespace.svc.cluster.local
```

**Example breakdown** for a service named `api` in `services` namespace:

```
api                          ← Service name  .services                  ← Namespace    .svc                     ← Service subdomain (always literal)      .cluster.local         ← Cluster domain (configurable, usually "cluster.local")
```

Complete FQDN: `api.services.svc.cluster.local`

### Short vs Long Names (Context Matters)

A Pod in the **same namespace** can use a **short name**:

```
# From a Pod in "services" namespacecurl http://api:8080/health
```

**Output:**

```
HTTP/1.1 200 OK{"status": "healthy"}
```

A Pod in **different namespace** must use the **full FQDN**:

```
# From a Pod in "agents" namespacecurl http://api.services.svc.cluster.local:8080/health
```

**Output:**

```
HTTP/1.1 200 OK{"status": "healthy"}
```

### Why the FQDN Matters

Short names only work because CoreDNS automatically appends the Pod's namespace. When you request `api` from namespace `agents`:

1.  Pod searches for `api` locally (not found—doesn't exist in `agents`)
2.  Pod searches for `api.agents.svc.cluster.local` (not found—service is in `services`)
3.  Failure: "host not found"

The FQDN bypasses this search chain entirely.

* * *

## Debugging DNS: nslookup and dig

When service discovery fails, manual DNS debugging reveals the root cause. You'll use two tools: `nslookup` (simpler) and `dig` (more detailed).

### Setting Up a Debug Pod

Create a debug Pod with DNS tools:

```
kubectl run -it debug-dns --image=busybox:1.35 --rm --restart=Never -- \  /bin/sh
```

Once inside the Pod:

```
/ #
```

### Using nslookup: DNS Lookup Basics

Query a service name:

```
nslookup api.services.svc.cluster.local
```

**Output (Success):**

```
Server:         10.96.0.10Address:        10.96.0.10#53Name:   api.services.svc.cluster.localAddress: 10.97.45.123
```

The server `10.96.0.10` is the kube-dns service. The resolved address `10.97.45.123` is the Service's ClusterIP.

**Output (Failure - Wrong Namespace):**

```
nslookup api.agents.svc.cluster.local
```

```
Server:         10.96.0.10Address:        10.96.0.10#53** server can't find api.agents.svc.cluster.local: NXDOMAIN
```

`NXDOMAIN` means "Non-Existent Domain"—the service doesn't exist in that namespace.

### Using dig: Detailed DNS Information

`dig` provides deeper insights into DNS records:

```
dig api.services.svc.cluster.local
```

**Output:**

```
; <<>> DiG 9.16.1-Ubuntu <<>> api.services.svc.cluster.local;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 12345;; flags: qr rd; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 0;; QUESTION SECTION:;api.services.svc.cluster.local. IN    A;; ANSWER SECTION:api.services.svc.cluster.local. 30 IN  A       10.97.45.123;; Query time: 2 msec
```

Key sections:

-   **QUESTION**: What are we looking up? (A record for IP address)
-   **ANSWER**: The IP address (10.97.45.123)
-   **Query time**: DNS resolution took 2 milliseconds (fast = healthy)

### SRV Records: Service Records for Load Balancing

For headless services, CoreDNS creates SRV records that list all Pod IPs:

```
dig SRV api.services.svc.cluster.local
```

**Output:**

```
;; ANSWER SECTION:api.services.svc.cluster.local. 30 IN  SRV     0 100 8080 api-5f7d8c4f9z.api.services.svc.cluster.local.api.services.svc.cluster.local. 30 IN  SRV     0 100 8080 api-5f7d8c4f9a.api.services.svc.cluster.local.;; ADDITIONAL SECTION:api-5f7d8c4f9z.api.services.svc.cluster.local. 30 IN A 10.244.0.5api-5f7d8c4f9a.api.services.svc.cluster.local. 30 IN A 10.244.0.6
```

SRV records include:

-   **Port number** (8080)
-   **Pod-specific FQDNs** (api-5f7d8c4f9z.api.services.svc.cluster.local)
-   **Pod IPs** (10.244.0.5, 10.244.0.6)

This allows clients to connect directly to Pods instead of going through the Service's load balancer.

* * *

## Headless Services: Direct Pod Discovery

Some applications need to connect directly to Pods, not through a load-balanced Service. Database replication, peer discovery, and stateful applications all require this. That's where headless services come in.

### ClusterIP vs Headless

A **regular Service** (ClusterIP):

```
apiVersion: v1kind: Servicemetadata:  name: api  namespace: servicesspec:  selector:    app: api  ports:    - port: 8080      targetPort: 8080
```

Returns a **single virtual IP**:

```
kubectl get svc -n services api
```

**Output:**

```
NAME   TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)api    ClusterIP   10.97.45.123    <none>        8080/TCP
```

A **headless Service** (no ClusterIP):

```
apiVersion: v1kind: Servicemetadata:  name: db  namespace: databasesspec:  clusterIP: None  # This makes it headless  selector:    app: postgres  ports:    - port: 5432      targetPort: 5432
```

Returns **Pod IPs directly**:

```
kubectl get svc -n databases db
```

**Output:**

```
NAME   TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)db     ClusterIP   None         <none>        5432/TCP
```

### DNS Resolution: Headless Service

Query a headless service:

```
dig db.databases.svc.cluster.local
```

**Output:**

```
;; ANSWER SECTION:db.databases.svc.cluster.local. 30 IN  A       10.244.1.5db.databases.svc.cluster.local. 30 IN  A       10.244.1.6db.databases.svc.cluster.local. 30 IN  A       10.244.1.7
```

Instead of one virtual IP, DNS returns **all Pod IPs** that match the selector. Clients can connect to any Pod directly.

* * *

## Troubleshooting Endpoint Mismatches

When DNS resolves but connections fail, the problem is usually **endpoint mismatch**: the Service selector doesn't match the Pod labels.

### Discovering Endpoints

List endpoints for a service:

```
kubectl get endpoints api -n services
```

**Output (Healthy):**

```
NAME   ENDPOINTS           AGEapi    10.244.0.5:8080     5m
```

The Service knows about one Pod at IP 10.244.0.5.

**Output (No Endpoints):**

```
NAME   ENDPOINTS   AGEapi    <none>      5m
```

The Service found zero Pods. This means the selector isn't matching any Pods.

### Debugging Selector Mismatch

Check the Service's selector:

```
kubectl get svc api -n services -o jsonpath='{.spec.selector}'
```

**Output:**

```
{"app":"api"}
```

The Service looks for Pods with label `app: api`.

Check Pods in the namespace:

```
kubectl get pods -n services --show-labels
```

**Output (Mismatch):**

```
NAME            STATUS   LABELSapi-5f7d8c      Running  app=backend,version=v1api-deployment  Running  app=api-service,version=v1
```

Neither Pod has `app: api`. The selector `app: api` matches zero Pods.

**Output (Match):**

```
NAME            STATUS   LABELSapi-5f7d8c      Running  app=api,version=v1api-deployment  Running  app=api,version=v1
```

Both Pods have `app: api`. Now check endpoints again:

```
kubectl get endpoints api -n services
```

**Output:**

```
NAME   ENDPOINTS                    AGEapi    10.244.0.5:8080,10.244.0.6:8080
```

Both Pods are now listed as endpoints.

### Manual Label Verification

Use `kubectl get pods` with label selector syntax:

```
kubectl get pods -n services -l app=api
```

**Output (No Results):**

```
No resources found in services namespace.
```

The selector matches zero Pods.

**Output (Match):**

```
NAME            READY   STATUS    RESTARTS   AGEapi-5f7d8c      1/1     Running   0          5mapi-deployment  1/1     Running   0          3m
```

The selector matches Pods successfully. Now endpoints should be populated.

* * *

## Cross-Namespace Service Discovery

Services in different namespaces don't see each other by default. You must use the FQDN to reach across namespaces.

### Accessing Services Across Namespaces

From a Pod in `agents` namespace accessing `api` service in `services` namespace:

```
# Short name (fails - wrong namespace)curl http://api:8080/health# Error: Could not resolve host: api# Full FQDN (succeeds)curl http://api.services.svc.cluster.local:8080/health# HTTP/1.1 200 OK
```

CoreDNS includes the full FQDN in all service discovery lookups. The FQDN is always correct.

### Default Namespace Assumption

Pods assume their own namespace when resolving short names. CoreDNS tries:

1.  `servicename` (fails immediately—not a valid FQDN)
2.  `servicename.namespace.svc.cluster.local` (finds the service in its own namespace)
3.  Falls back through search domains if configured

This is why short names only work in-namespace.

* * *

## Connectivity Test: From Debugging to Validation

Let's walk through a complete debugging scenario, from failure to root cause to fix.

### Scenario: Agent A Calls Agent B

**Setup:**

-   Agent A Pod in `agents` namespace
-   Agent B Service in `services` namespace
-   Agent A can't reach Agent B

**Step 1: Verify Service Exists**

```
kubectl get svc -n services
```

**Output:**

```
NAME    TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)agent-b ClusterIP   10.97.123.45     <none>        8080/TCP
```

Service exists. Step 2: Check endpoints.

**Step 2: Verify Endpoints**

```
kubectl get endpoints agent-b -n services
```

**Output:**

```
NAME      ENDPOINTS   AGEagent-b   <none>      10m
```

No endpoints. The Service has no Pods. Step 3: Check selectors.

**Step 3: Check Service Selector**

```
kubectl get svc agent-b -n services -o jsonpath='{.spec.selector}'
```

**Output:**

```
{"app":"agent-b","version":"v1"}
```

Step 4: Check if Pods match.

**Step 4: List Pods with Required Labels**

```
kubectl get pods -n services -l app=agent-b,version=v1
```

**Output:**

```
No resources found in services namespace.
```

No Pods match. Step 5: Check what Pods exist.

**Step 5: List All Pods in Namespace**

```
kubectl get pods -n services --show-labels
```

**Output:**

```
NAME             READY   STATUS    LABELSagent-b-5f7d8c   1/1     Running   app=agent-b,version=v2
```

The Pod has label `version=v2` but the Service requires `version=v1`.

**Root Cause:** Label mismatch.

**Fix:** Update Deployment to match Service selector:

```
apiVersion: apps/v1kind: Deploymentmetadata:  name: agent-b  namespace: servicesspec:  selector:    matchLabels:      app: agent-b      version: v1  # Match Service selector  template:    metadata:      labels:        app: agent-b        version: v1  # Match Service selector    spec:      containers:      - name: agent-b        image: myregistry.azurecr.io/agent-b:latest        ports:        - containerPort: 8080
```

Apply and verify:

```
kubectl apply -f agent-b-deployment.yamlkubectl get endpoints agent-b -n services
```

**Output:**

```
NAME      ENDPOINTS              AGEagent-b   10.244.0.10:8080       2m
```

Endpoints now populated. Test from Agent A:

```
kubectl run -it agent-a-test --image=curlimages/curl --rm -- \  curl http://agent-b.services.svc.cluster.local:8080/health
```

**Output:**

```
HTTP/1.1 200 OK{"status": "healthy"}
```

Success.

* * *

## Try With AI

**Setup**: You have three microservices in Kubernetes:

-   `auth-service` in `auth` namespace (handles authentication)
-   `api-gateway` in `api` namespace (routes requests)
-   `user-db` in `databases` namespace (PostgreSQL database)

Both `api-gateway` and `auth-service` are running, but `api-gateway` cannot reach `auth-service`. Connections time out.

**Part 1: Manual Diagnosis**

Before asking AI, diagnose manually:

1.  Verify `auth-service` exists:
    
    ```
    kubectl get svc -n auth auth-service
    ```
    
2.  Check endpoints:
    
    ```
    kubectl get endpoints auth-service -n auth
    ```
    
3.  Query DNS from a debug Pod:
    
    ```
    kubectl run -it debug --image=busybox:1.35 --rm --restart=Never -- \  nslookup auth-service.auth.svc.cluster.local
    ```
    
4.  Check the Service selector:
    
    ```
    kubectl get svc auth-service -n auth -o jsonpath='{.spec.selector}'
    ```
    
5.  List Pods in the namespace and compare labels:
    
    ```
    kubectl get pods -n auth --show-labels
    ```
    

**Part 2: Gathering Evidence**

Before consulting AI, collect:

-   Service definition (YAML)
-   Endpoint status
-   Pod labels
-   DNS query results
-   Error message from API Gateway logs

This evidence determines whether the issue is DNS, endpoints, or labels.

**Part 3: Collaboration with AI**

Once you've gathered evidence, ask AI:

"I have `auth-service` in the `auth` namespace. DNS resolves `auth-service.auth.svc.cluster.local` to 10.97.50.100, but `api-gateway` in the `api` namespace gets connection timeouts. Here's the Service definition \[paste YAML\], the endpoints output shows `<none>`, and the Pods in the namespace have labels \[paste labels\]. What's the likely root cause?"

AI will identify the mismatch between Service selector and Pod labels, or point out that endpoints are missing entirely.

**Part 4: Validation**

Test your fix:

```
kubectl run -it api-test --image=curlimages/curl --rm -- \  curl -v http://auth-service.auth.svc.cluster.local:8080/health
```

Connection should succeed (HTTP 200 or appropriate response).

Compare your manual diagnosis to AI's analysis. What did you miss? What did AI catch that you didn't?

Checking access...

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 50: Kubernetes for AI Services](/docs/AI-Cloud-Native-Development/kubernetes-for-ai-services)
-   StatefulSets (Optional)

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/50-kubernetes-for-ai-services/20-statefulsets-optional.md)

# StatefulSets: When Your Agent Needs Identity

You've deployed stateless agents with Deployments—web services that don't care which replica handles their request. But what about vector databases? Qdrant, Milvus, or other stateful services that require stable identity and ordered startup.

Try deploying a Qdrant vector database with a standard Deployment. When Pods scale down, which replica loses its data? When they scale up, which replica is the primary? These questions break Deployment's "any replica is interchangeable" assumption.

**StatefulSets** solve this: Pods get stable hostnames (qdrant-0, qdrant-1, qdrant-2), ordered lifecycle (always start 0 first, then 1, then 2), and persistent storage that follows them. Your vector database nodes maintain their identity even when they restart.

* * *

## Why Deployments Aren't Enough

Deployments excel at stateless agents: API servers, workers, load-balanced services where "pod-abc123" crashing is fine because "pod-def456" is identical. The power of Deployments comes from treating Pods as disposable. When a Pod crashes, the Deployment controller creates a replacement with a new random name, and nothing cares because the application layer doesn't depend on Pod identity.

But some workloads violate this assumption. Vector databases, distributed caches, and stateful AI services need something different:

Characteristic

Deployment

StatefulSet

**Pod Identity**

Random (pod-abc123)

Stable (qdrant-0, qdrant-1)

**Scaling Order**

Parallel (all at once)

Ordered (0, then 1, then 2)

**Storage**

Ephemeral or shared

Per-Pod, persistent

**Network**

Dynamic IP, service routes

Stable DNS: pod-0.service-name

**Use Case**

Stateless agents, APIs

Databases, message brokers, AI inference replicas

### Why Pod Identity Matters

When you run Qdrant (a distributed vector database), each replica maintains a shard of your embedding index. The cluster topology is fixed: replica 0 owns shards A-C, replica 1 owns D-F, replica 2 owns G-I. Other replicas need to contact "qdrant-0" to access shard A. If replica 0 crashes and is replaced with a new Pod named "qdrant-xyz123", the topology breaks. Other nodes can't find the data they need.

### The Problem Scenario

You want to deploy Qdrant with 3 replicas for distributed vector search. Each replica maintains shards of your embedding index:

```
# With Deployment, Pod IPs change constantlykubectl get pods -l app=qdrant
```

**Output:**

```
NAME                      READY   STATUS    RESTARTS   AGEqdrant-66d4cb8c9c-abc12   1/1     Running   0          2mqdrant-66d4cb8c9c-def45   1/1     Running   0          1mqdrant-66d4cb8c9c-ghi67   1/1     Running   0          30s
```

When pod `qdrant-66d4cb8c9c-abc12` crashes, Kubernetes replaces it with `qdrant-66d4cb8c9c-zyx98`. But Qdrant expects `qdrant-0`, `qdrant-1`, `qdrant-2` to remain stable. The cluster topology breaks.

* * *

## Stable Network Identity

StatefulSets guarantee three critical things:

1.  **Stable Hostname**: Pod 0 is always `qdrant-0`, Pod 1 is always `qdrant-1`. Even if the Pod crashes and restarts, it keeps the same name.
2.  **Stable DNS**: Access via `qdrant-0.qdrant-service.default.svc.cluster.local`. Kubernetes DNS always resolves this to the current Pod.
3.  **Ordered Lifecycle**: Pod 0 starts first, followed by Pod 1, then Pod 2. When scaling down, Pod 2 terminates first, then Pod 1, then Pod 0. This predictability is essential for stateful services that need initialization order.

This combination solves the distributed systems problem: services can discover each other by name, and that name never changes.

### Headless Service

The mechanism is a **headless Service** (no ClusterIP, just DNS). Instead of creating a single virtual IP that load-balances across Pods, a headless Service tells Kubernetes: "Don't create a virtual IP. Just point DNS directly at each Pod individually."

```
apiVersion: v1kind: Servicemetadata:  name: qdrant-servicespec:  clusterIP: None  # Headless: no single IP, direct to Pods  selector:    app: qdrant  ports:  - port: 6333    name: api
```

The `serviceName: qdrant-service` in the StatefulSet must match this Service name exactly.

**Apply and verify:**

```
kubectl apply -f qdrant-service.yamlkubectl get service qdrant-service
```

**Output:**

```
NAME              TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)    AGEqdrant-service    ClusterIP   None         <none>        6333/TCP   2s
```

The `None` ClusterIP (instead of something like `10.96.0.10`) tells Kubernetes: "Don't create a virtual IP. This is headless."

### Stable Pod DNS

When you create a StatefulSet with this Service, each Pod gets a stable DNS name:

```
# From inside any Pod, query DNSnslookup qdrant-0.qdrant-service.default.svc.cluster.local
```

**Output:**

```
Server:    10.96.0.10Address 1: 10.96.0.10 kube-dns.kube-system.svc.cluster.localName:      qdrant-0.qdrant-service.default.svc.cluster.localAddress 1: 10.244.0.5
```

Pod `qdrant-0` is always accessible at that hostname, even if its IP changes internally.

* * *

## Creating a StatefulSet

StatefulSets are similar to Deployments in structure, but with critical additions: `serviceName` (must match the headless Service), `volumeClaimTemplates` (creates a PVC per Pod), and guaranteed ordering.

Here's a StatefulSet for Qdrant with 3 replicas, each with persistent storage:

```
apiVersion: apps/v1kind: StatefulSetmetadata:  name: qdrantspec:  serviceName: qdrant-service  # Must match headless Service name  replicas: 3  selector:    matchLabels:      app: qdrant  template:    metadata:      labels:        app: qdrant    spec:      containers:      - name: qdrant        image: qdrant/qdrant:latest        ports:        - containerPort: 6333          name: api        volumeMounts:        - name: qdrant-data          mountPath: /qdrant/storage        resources:          requests:            cpu: 500m            memory: 512Mi          limits:            cpu: 1000m            memory: 1Gi  volumeClaimTemplates:  - metadata:      name: qdrant-data    spec:      accessModes: [ "ReadWriteOnce" ]      resources:        requests:          storage: 10Gi
```

**Apply the StatefulSet:**

```
kubectl apply -f qdrant-statefulset.yamlkubectl get statefulsets
```

**Output:**

```
NAME     READY   AGEqdrant   0/3     3s
```

**Watch the ordered creation:**

```
kubectl get pods -l app=qdrant --watch
```

**Output:**

```
NAME      READY   STATUS            RESTARTS   AGEqdrant-0  0/1     Init:0/1          0          2sqdrant-1  0/1     Pending           0          1s   # Waits for qdrant-0 Readyqdrant-2  0/1     Pending           0          0s   # Waits for qdrant-1 Ready# After qdrant-0 is Ready:qdrant-0  1/1     Running           0          10sqdrant-1  0/1     ContainerCreating 0          9sqdrant-2  0/1     Pending           0          8s# After qdrant-1 is Ready:qdrant-0  1/1     Running           0          15sqdrant-1  1/1     Running           0          14sqdrant-2  0/1     ContainerCreating 0          13s# All ready:qdrant-0  1/1     Running           0          20sqdrant-1  1/1     Running           0          19sqdrant-2  1/1     Running           0          18s
```

Each Pod waits for the previous one to be Ready. This ensures proper cluster initialization.

* * *

## Ordered Scaling

Scale down a StatefulSet, and Pod indices scale down in **reverse** order:

```
kubectl scale statefulset qdrant --replicas=2kubectl get pods
```

**Output:**

```
NAME      READY   STATUS        RESTARTS   AGEqdrant-0  1/1     Running       0          5mqdrant-1  1/1     Running       0          4mqdrant-2  1/1     Terminating   0          3m
```

Pod 2 terminates first. This is critical: the highest indices are transient; lower indices are primary. When you scale down, you lose the most recent replicas first, not random ones.

**Scale back up:**

```
kubectl scale statefulset qdrant --replicas=3
```

**Output:**

```
NAME      READY   STATUS    RESTARTS   AGEqdrant-0  1/1     Running   0          6mqdrant-1  1/1     Running   0          5mqdrant-2  1/1     Running   0          1s  # Recreated in order
```

New Pod 2 is created. The StatefulSet re-establishes the predictable topology.

* * *

## Rolling Updates

Unlike Deployments which can update all replicas in parallel, StatefulSets update one Pod at a time, starting from the highest ordinal and working backward (Pod 2, then Pod 1, then Pod 0). This is safer for stateful workloads but slower.

StatefulSets also support **partition-based rolling updates** to control which Pods get updated. This is critical for testing new versions safely:

```
kubectl patch statefulset qdrant -p '{"spec":{"updateStrategy":{"type":"RollingUpdate","rollingUpdate":{"partition":1}}}}'
```

This tells Kubernetes: "Update only Pods with index >= 1 (so 1 and 2). Keep Pod 0 at the old version."

```
kubectl set image statefulset/qdrant qdrant=qdrant/qdrant:v1.7.0 --recordkubectl get pods
```

**Output:**

```
NAME      READY   STATUS              RESTARTS   AGEqdrant-0  1/1     Running             0          8m     # Old version (partition=1)qdrant-1  0/1     ContainerCreating   0          3s     # New version (updating)qdrant-2  1/1     Running             0          2m
```

Pod 1 updates first to v1.7.0. When ready, Pod 2 updates. Pod 0 stays at the old version, letting you test new versions safely. If v1.7.0 breaks, you can rollback the partition and Pod 1 reverts immediately without touching Pod 0.

* * *

## Persistent Storage Per Pod

The `volumeClaimTemplates` section in the StatefulSet is what makes persistent state possible. For each Pod, Kubernetes creates a PersistentVolumeClaim (PVC) with a stable name matching the Pod ordinal.

**Verify the PVCs:**

```
kubectl get pvc
```

**Output:**

```
NAME                      STATUS   VOLUME                     CAPACITY   ACCESSMODESqdrant-data-qdrant-0      Bound    pvc-123abc456def789        10Gi       RWOqdrant-data-qdrant-1      Bound    pvc-789ghi012jkl345        10Gi       RWOqdrant-data-qdrant-2      Bound    pvc-456mno789pqr012        10Gi       RWO
```

Notice the naming: `qdrant-data-qdrant-0`, `qdrant-data-qdrant-1`, etc. The pattern is `{volume-name}-{statefulset-name}-{ordinal}`.

Each Pod has its own dedicated storage. When Pod 1 crashes and restarts, Kubernetes automatically reconnects it to `qdrant-data-qdrant-1`, preserving the data and cluster state. This is why StatefulSets are suitable for databases: data isn't lost on Pod restart.

* * *

## Try With AI

**Setup**: You're deploying a distributed LLM inference service with model replication. Each replica needs stable identity and persistent model cache.

**Scenario**: Your FastAPI agent (from Chapter 49) serves LLM inference. You want to:

-   Deploy 3 replicas with stable hostnames: inference-0, inference-1, inference-2
-   Each replica caches the LLM model locally (10GB cache per Pod)
-   Rolling updates should happen one Pod at a time, starting with replica 2

**Prompts to try:**

1.  "Design a StatefulSet for LLM inference with 3 replicas. Each replica caches a 10GB model. The headless Service should be `inference-service`. Show the full manifest with volumeClaimTemplates."
    
2.  "I want rolling updates to start with replica 2 (highest index) and roll backward to replica 0. How do I configure the partition strategy? Show the updated StatefulSet configuration."
    
3.  "One of our inference replicas crashed and has stale cache (corrupted model). We want to delete the PVC for that Pod specifically without affecting the others. What kubectl commands do we run, and what happens to the StatefulSet afterward?"
    

**Expected outcomes:**

-   You describe a StatefulSet with 3 replicas and volumeClaimTemplates
-   You explain how partition updates work and why starting with higher indices makes sense
-   You understand that deleting a Pod and its PVC causes the StatefulSet to recreate both

Checking access...

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 50: Kubernetes for AI Services](/docs/AI-Cloud-Native-Development/kubernetes-for-ai-services)
-   Persistent Storage (Optional)

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/50-kubernetes-for-ai-services/21-persistent-storage-optional.md)

# Persistent Storage: PV, PVC, StorageClass

Your FastAPI agent runs in a Pod on Kubernetes. But Pods are ephemeral—when they restart, their filesystem disappears. This is a critical problem: Your agent has embedded vector search indexes, model checkpoints, conversation logs. When the Pod crashes and Kubernetes creates a replacement, all that data is gone.

**PersistentVolumes (PVs)** and **PersistentVolumeClaims (PVCs)** solve this by decoupling storage from compute. Storage exists independent of Pods. When a Pod restarts, it reconnects to the same storage and your agent resumes with all previous state intact.

This lesson teaches you to provision persistent storage manually, understand the abstraction that makes Kubernetes storage work, and configure your Pods to use that storage reliably.

* * *

## The Problem: Data Loss on Pod Restart

Let's see what happens without persistent storage.

Create a simple Pod that writes data to its local filesystem:

```
apiVersion: v1kind: Podmetadata:  name: ephemeral-appspec:  containers:  - name: app    image: busybox:1.28    command: ['sh']    args: ['-c', 'echo "Agent state data" > /app/state.txt; sleep 3600']    volumeMounts:    - name: app-storage      mountPath: /app  volumes:  - name: app-storage    emptyDir: {}
```

Create this Pod:

```
kubectl apply -f ephemeral-app.yaml
```

**Output:**

```
pod/ephemeral-app created
```

Check that the file exists inside the Pod:

```
kubectl exec ephemeral-app -- cat /app/state.txt
```

**Output:**

```
Agent state data
```

Now delete the Pod:

```
kubectl delete pod ephemeral-app
```

**Output:**

```
pod "ephemeral-app" deleted
```

The data is gone forever. `emptyDir` (temporary storage) is cleared when the Pod terminates. For embeddings, model weights, and conversation history, you need storage that survives Pod restarts.

* * *

## The PV/PVC Abstraction: Separation of Concerns

Kubernetes separates storage concerns into two layers:

**PersistentVolume (PV)**: The infrastructure—a chunk of storage that exists in your cluster. A cluster administrator provisions PVs from available storage (local disk, network storage, cloud volumes). PVs are cluster-level resources.

**PersistentVolumeClaim (PVC)**: The request—a developer specifies "I need 10GB of storage with read-write access." Kubernetes finds a matching PV and binds them together. PVCs are namespace-scoped.

This abstraction parallels the CPU/memory model:

-   **Node** (infrastructure) vs **Pod** (consumer request)
-   **PersistentVolume** (infrastructure) vs **PersistentVolumeClaim** (consumer request)

Think of it like renting office space:

-   **Building owner** (cluster admin) provides physical office spaces (PVs)
-   **Company manager** (developer) requests an office from the building (PVC)
-   **Company** (Pod) uses the office while it exists

When the company moves to a different office building (Pod restarts), the same office (PV) still exists. A new company can occupy it, or the same company can return to the same office after relocation.

* * *

## Creating a Static PersistentVolume

Let's create a PV manually. We'll use `hostPath`—storage backed by a directory on the Kubernetes node. This is suitable for learning and single-node clusters like Docker Desktop Kubernetes.

First, create a directory for storage (Docker Desktop mounts your local filesystem):

```
mkdir -p /tmp/k8s-dataecho "stored data" > /tmp/k8s-data/test.txt
```

**Output:**

```
# Directory created with test file
```

Now create a PersistentVolume that points to that directory:

```
apiVersion: v1kind: PersistentVolumemetadata:  name: agent-storage-pvspec:  capacity:    storage: 10Gi  accessModes:    - ReadWriteOnce  hostPath:    path: /tmp/k8s-data
```

Apply this manifest:

```
kubectl apply -f pv.yaml
```

**Output:**

```
persistentvolume/agent-storage-pv created
```

Check that the PV was created:

```
kubectl get pv
```

**Output:**

```
NAME                CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM   STORAGECLASS   REASON   AGEagent-storage-pv    10Gi       RWO            Delete           Available            manual         <none>   7s
```

Notice the **STATUS: Available**. The PV exists but is not yet bound to any PVC. The **RECLAIM POLICY: Delete** means that when a PVC is deleted, this PV will be deleted too (other options: Retain, Recycle).

* * *

## Claiming Storage with PersistentVolumeClaim

A PVC is a request for storage. Create a PVC that claims the PV we just created:

```
apiVersion: v1kind: PersistentVolumeClaimmetadata:  name: agent-storage-claimspec:  accessModes:    - ReadWriteOnce  resources:    requests:      storage: 5Gi
```

Apply this manifest:

```
kubectl apply -f pvc.yaml
```

**Output:**

```
persistentvolumeclaim/agent-storage-claim created
```

Check that the PVC was created and is bound:

```
kubectl get pvc
```

**Output:**

```
NAME                    STATUS   VOLUME              CAPACITY   ACCESS MODES   STORAGECLASS   AGEagent-storage-claim     Bound    agent-storage-pv    10Gi       RWO            manual         3s
```

Check the PV status again:

```
kubectl get pv
```

**Output:**

```
NAME                CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                         STORAGECLASS   REASON   AGEagent-storage-pv    10Gi       RWO            Delete           Bound    default/agent-storage-claim   manual          <none>   47s
```

The PV is now **Bound** to the PVC. They're connected. The binding was automatic based on:

-   AccessModes match (both RWO)
-   Requested storage (5Gi) is less than available (10Gi)
-   No StorageClass specified (defaults to "manual")

Now create a Pod that mounts this PVC:

```
apiVersion: v1kind: Podmetadata:  name: agent-with-storagespec:  containers:  - name: agent    image: busybox:1.28    command: ['sh']    args: ['-c', 'cat /agent-data/test.txt && sleep 3600']    volumeMounts:    - name: persistent-storage      mountPath: /agent-data  volumes:  - name: persistent-storage    persistentVolumeClaim:      claimName: agent-storage-claim
```

Apply this manifest:

```
kubectl apply -f agent-pod.yaml
```

**Output:**

```
pod/agent-with-storage created
```

Check the logs to confirm the Pod mounted the storage successfully:

```
kubectl logs agent-with-storage
```

**Output:**

```
stored data
```

The Pod successfully read the file we created in `/tmp/k8s-data/test.txt` earlier. The storage persists across container restarts because it's backed by the host filesystem, not the container's ephemeral layer.

Delete the Pod and recreate it:

```
kubectl delete pod agent-with-storage
```

**Output:**

```
pod "agent-with-storage" deleted
```

```
kubectl apply -f agent-pod.yaml
```

**Output:**

```
pod/agent-with-storage created
```

Check the logs again:

```
kubectl logs agent-with-storage
```

**Output:**

```
stored data
```

The data is still there. The storage survived the Pod deletion and recreation. This is the core benefit of PersistentVolumes: **data outlives container instances**.

* * *

## Dynamic Provisioning with StorageClass

Creating PVs manually doesn't scale. In production, you use **StorageClasses** to provision PVs dynamically.

A StorageClass defines:

-   **Provisioner**: The component that creates storage (e.g., `docker.io/hostpath` for Docker Desktop, AWS EBS provisioner for AWS)
-   **Parameters**: Storage configuration (IOPS, encryption, filesystem type, etc.)
-   **Reclaim Policy**: What happens to storage when the PVC is deleted

First, check what StorageClasses are available in your cluster:

```
kubectl get storageclass
```

**Output:**

```
NAME                 PROVISIONER                   RECLAIMPOLICY   VOLUMEBINDINGMODE      ALLOWVOLUMEEXPANSION   AGEhostpath (default)   docker.io/hostpath            Delete          Immediate              false                  2h
```

Docker Desktop comes with a default StorageClass. Now create a PVC that uses this StorageClass (no PV needed—it's created automatically):

```
apiVersion: v1kind: PersistentVolumeClaimmetadata:  name: dynamic-storage-claimspec:  storageClassName: standard  accessModes:    - ReadWriteOnce  resources:    requests:      storage: 2Gi
```

Apply this manifest:

```
kubectl apply -f dynamic-pvc.yaml
```

**Output:**

```
persistentvolumeclaim/dynamic-storage-claim created
```

Check the PVC:

```
kubectl get pvc
```

**Output:**

```
NAME                      STATUS   VOLUME                                    CAPACITY   ACCESS MODES   STORAGECLASS   AGEagent-storage-claim       Bound    agent-storage-pv                          10Gi       RWO            manual         5mdynamic-storage-claim     Bound    pvc-4a2b1c9d-8f3e-4b5a-9c2d-7e6f5a4b3c   2Gi        RWO            standard       2s
```

**Automatic PV creation**: Kubernetes provisioner created a PV automatically and bound the PVC to it. Notice the PV name is generated (`pvc-4a2b1c9d...`). You don't need to manually create PVs anymore.

Create a Pod using this dynamically-provisioned PVC:

```
apiVersion: v1kind: Podmetadata:  name: dynamic-storage-podspec:  containers:  - name: app    image: busybox:1.28    command: ['sh']    args: ['-c', 'echo "Dynamic storage test" > /data/test.txt && cat /data/test.txt && sleep 3600']    volumeMounts:    - name: dynamic-vol      mountPath: /data  volumes:  - name: dynamic-vol    persistentVolumeClaim:      claimName: dynamic-storage-claim
```

Apply and check logs:

```
kubectl apply -f dynamic-pod.yamlkubectl logs dynamic-storage-pod
```

**Output:**

```
Dynamic storage test
```

Dynamic provisioning eliminates manual PV management. Developers just declare PVCs with desired storage size and access mode; the provisioner handles infrastructure provisioning.

* * *

## Access Modes: Who Can Access Storage How?

PersistentVolumes support three access modes:

**ReadWriteOnce (RWO)**: The volume can be mounted as read-write by a **single Pod** (but that Pod's containers can all read and write). Most restrictive mode.

-   Use for: Databases, stateful applications that require single writer
-   Example: PostgreSQL pod

```
accessModes:  - ReadWriteOnce
```

**ReadOnlyMany (ROX)**: The volume can be mounted as **read-only by many Pods**. Multiple readers, no writers allowed.

-   Use for: Shared configuration, reference data, model weights distributed to many inference Pods
-   Example: Vector embeddings used by 100 inference Pods

```
accessModes:  - ReadOnlyMany
```

**ReadWriteMany (RWX)**: The volume can be mounted as read-write by **many Pods simultaneously**. Requires network storage (not hostPath).

-   Use for: Shared logs, distributed training, collaborative applications
-   Example: Training data accessed by multiple training pods simultaneously
-   Requires: Network filesystem (NFS, SMB) not available in Docker Desktop by default

```
accessModes:  - ReadWriteMany
```

Create a read-only PVC for agent embeddings:

```
apiVersion: v1kind: PersistentVolumeClaimmetadata:  name: embeddings-ro-claimspec:  storageClassName: standard  accessModes:    - ReadOnlyMany  resources:    requests:      storage: 5Gi
```

This PVC can be mounted by multiple inference Pods. If one embedding update Pod writes to it, the read-only mounting enforces that other Pods cannot accidentally overwrite data.

* * *

## Reclaim Policies: What Happens When a PVC Deletes?

When you delete a PVC, what happens to the underlying PV? The reclaim policy controls this:

**Delete**: The PV is deleted when the PVC is deleted. Storage is freed immediately. Suitable for dynamic provisioning where storage is cheap.

```
reclaimPolicy: Delete
```

**Retain**: The PV persists after PVC deletion. A cluster admin must manually delete the PV or recycle it. Suitable for important data where you want manual verification before deletion.

```
reclaimPolicy: Retain
```

**Recycle** (deprecated): The PV is wiped and made available for reuse. Avoided in production due to data security concerns.

* * *

## Putting It Together: Agent with Persistent Embeddings

Here's a realistic Pod configuration for an agent that stores embeddings and checkpoints:

```
apiVersion: v1kind: PersistentVolumeClaimmetadata:  name: agent-embeddings-claimspec:  storageClassName: standard  accessModes:    - ReadWriteOnce  resources:    requests:      storage: 50Gi  # Space for embeddings and checkpoints---apiVersion: v1kind: Podmetadata:  name: vector-agentspec:  containers:  - name: agent    image: my-agent:v1    env:    - name: EMBEDDINGS_PATH      value: /agent-storage/embeddings    - name: CHECKPOINTS_PATH      value: /agent-storage/checkpoints    volumeMounts:    - name: agent-storage      mountPath: /agent-storage    resources:      requests:        memory: "2Gi"        cpu: "500m"      limits:        memory: "4Gi"        cpu: "2"  volumes:  - name: agent-storage    persistentVolumeClaim:      claimName: agent-embeddings-claim
```

When this Pod runs:

1.  The PVC claims storage from the StorageClass
2.  Kubernetes provisions a PV automatically
3.  The Pod mounts the PV at `/agent-storage`
4.  The agent writes embeddings and checkpoints to `/agent-storage/embeddings` and `/agent-storage/checkpoints`
5.  If the Pod restarts, it reconnects to the same storage
6.  All embeddings and checkpoints survive the restart

Your agent continues serving requests without recomputing embeddings from scratch.

* * *

## Try With AI

**Setup**: You're designing persistent storage for a multi-agent system. One agent computes and caches vector embeddings. Five other agents need read-only access to those embeddings. A background service periodically updates the embeddings.

**Challenge Prompts**:

Ask AI: "Design a PVC and access mode strategy for this scenario:

-   1 embedding generator Pod writes embeddings weekly
-   5 inference Pods read those embeddings continuously
-   I want to ensure inference Pods can't accidentally overwrite embeddings
-   I want minimal disk space wastage

What access modes and binding strategy should I use? Should the embeddings and generators use separate PVCs?"

Follow up: "The embedding generator needs to update embeddings without downtime. My inference Pods must continue serving. What reclaim policy and update strategy would work best? Should I use ReadOnlyMany or a different approach?"

Then: "Write a Kubernetes manifest for this architecture. Include the PVC for embeddings, the PVC for the generator (if separate), and Pod definitions for one inference Pod and the generator Pod. Ensure the inference Pod includes volume mounts for the embeddings."

**What to evaluate**:

-   Does the design isolate read-only and read-write storage?
-   Are access modes correctly matched to each component's needs?
-   Would this architecture actually prevent accidental overwrites?
-   How would the embeddings update without breaking inference Pods?

Compare your initial understanding of the access modes to what emerged through the conversation. What trade-offs between storage isolation, update frequency, and complexity did you discover?

Checking access...

---

-   [](/)
-   [Part 6: AI Cloud Native Development](/docs/AI-Cloud-Native-Development)
-   [Chapter 50: Kubernetes for AI Services](/docs/AI-Cloud-Native-Development/kubernetes-for-ai-services)
-   Kubernetes Security Deep Dive (Optional)

Updated Mar 05, 2026

[Version history](https://github.com/panaversity/ai-native-software-development/commits/main/apps/learn-app/docs/06-AI-Cloud-Native-Development/50-kubernetes-for-ai-services/22-kubernetes-security-optional.md)

# Kubernetes Security for AI Services

Your FastAPI agent is now deployed to Kubernetes (Lesson 4). It's running, scaling, exposed to traffic. But here's the question: **who can access what?**

In a production cluster, your agent container might handle sensitive data—user conversations, API keys, model weights. A compromised container could leak everything. This lesson builds the security foundations that protect your agent in production: non-root execution, read-only filesystems, network isolation, and vulnerability scanning.

By the end, your agent will run with minimal privileges, reject requests from unauthorized namespaces, and expose zero unnecessary attack surface.

* * *

## The Security Specification

Before we write a single YAML line, let's define what "secure" means for your agent.

**Security Intent**: AI agent handling sensitive user data must not run as root, must have read-only filesystem, must be isolated from other namespaces, and must reject unauthorized network traffic.

**Success Criteria**:

-   ✅ Container runs as non-root user (UID > 1000)
-   ✅ Root filesystem is read-only
-   ✅ Container cannot gain elevated privileges
-   ✅ Agent Pod only receives traffic from authorized namespaces
-   ✅ Pod adheres to Restricted Pod Security Standard

**Constraints**:

-   Must preserve application functionality (logging, tmp files still work)
-   Container must have specific user ID pre-built into the image
-   Network Policies require matching labels for routing

**Non-Goals**:

-   Encrypting data at rest (handled by encrypted persistent volumes)
-   Secret rotation automation (handled by external secret managers)
-   Pod-to-Pod TLS encryption (handled by service mesh)

This specification guides every decision we make in this lesson.

* * *

## SecurityContext: Running as Non-Root

The first line of defense is **SecurityContext**—a Kubernetes configuration that controls how a container runs at the OS level.

### Why Non-Root Matters

By default, containers inherit the permissions of the user who created the image. In many base images (Python, Node), that user is root. This means:

```
Root container compromised → Attacker has root on the entire container                         → Attacker can modify any file in the image                         → Attacker can modify the kernel
```

Running as non-root doesn't prevent compromise, but it limits what an attacker can do after gaining access.

### Building a Secure Image

First, create an image with a non-root user. In your Dockerfile:

```
FROM python:3.11-slimWORKDIR /appCOPY requirements.txt .RUN pip install -r requirements.txt# Create a non-root userRUN useradd -m -u 1001 agentuser# Set working directory permissionsRUN chown -R agentuser:agentuser /appUSER agentuserCOPY --chown=agentuser:agentuser . .CMD ["python", "agent.py"]
```

**Key points**:

-   `useradd -m -u 1001 agentuser` creates a user with ID 1001 (non-root, > 1000)
-   `chown` transfers ownership to the new user
-   `USER agentuser` makes the container run as this user by default
-   `--chown` flag on `COPY` preserves ownership during the build

Build and push this image:

```
docker build -t myregistry/agent:v1-secure .docker push myregistry/agent:v1-secure
```

**Output:**

```
Successfully built sha256:abc123...Successfully tagged myregistry/agent:v1-secureThe push refers to repository [myregistry/agent]v1-secure: digest: sha256:def456... size: 45MB
```

### Enforcing Non-Root with SecurityContext

Even if your image runs as a non-root user, Kubernetes can enforce it with SecurityContext. This prevents accidentally running a container as root.

```
apiVersion: v1kind: Podmetadata:  name: agent-securespec:  securityContext:    runAsNonRoot: true    runAsUser: 1001    fsGroup: 1001  containers:  - name: agent    image: myregistry/agent:v1-secure    securityContext:      allowPrivilegeEscalation: false      readOnlyRootFilesystem: false      capabilities:        drop:          - ALL
```

**What each setting does**:

-   **`runAsNonRoot: true`**: Kubernetes rejects any container that tries to run as root (UID 0)
-   **`runAsUser: 1001`**: Force the container to run as user 1001, even if the image says otherwise
-   **`fsGroup: 1001`**: Group ownership of volumes mounted to the Pod
-   **`allowPrivilegeEscalation: false`**: Container cannot become root later (blocks `sudo`, setuid)
-   **`drop: ALL`**: Remove ALL Linux capabilities (no raw sockets, no device access)

Apply this Pod:

```
kubectl apply -f agent-secure.yaml
```

**Output:**

```
pod/agent-secure created
```

Verify the container runs as the correct user:

```
kubectl exec agent-secure -- id
```

**Output:**

```
uid=1001(agentuser) gid=1001(agentuser) groups=1001(agentuser)
```

The container is now running as user 1001, not root.

* * *

## Read-Only Root Filesystem

The second layer: **read-only root filesystem**. An attacker who gains code execution inside the container can modify files on disk, install backdoors, or change the application logic. A read-only filesystem blocks this attack vector.

### Understanding Filesystem Layers

When you mount a read-only filesystem, the application can still write to specific locations using **emptyDir** volumes. These are temporary, per-Pod directories that disappear when the Pod restarts—perfect for logs, temp files, and caches.

### Configuring Read-Only Root with Writable Volume

```
apiVersion: apps/v1kind: Deploymentmetadata:  name: agent-appspec:  replicas: 2  selector:    matchLabels:      app: agent  template:    metadata:      labels:        app: agent    spec:      securityContext:        runAsNonRoot: true        runAsUser: 1001      containers:      - name: agent        image: myregistry/agent:v1-secure        securityContext:          readOnlyRootFilesystem: true          allowPrivilegeEscalation: false          capabilities:            drop:              - ALL        volumeMounts:        - name: tmp-volume          mountPath: /tmp        - name: logs-volume          mountPath: /var/log/agent        ports:        - containerPort: 8000      volumes:      - name: tmp-volume        emptyDir: {}      - name: logs-volume        emptyDir: {}
```

**How this works**:

-   **`readOnlyRootFilesystem: true`**: Root filesystem cannot be modified
-   **`volumeMounts`**: Mount writable locations for the app
-   **`emptyDir: {}`**: A temporary directory backed by the host's disk (or memory, depending on config)

The application can write to `/tmp` and `/var/log/agent`, but every other file is read-only.

Deploy this:

```
kubectl apply -f agent-deployment-readonly.yaml
```

**Output:**

```
deployment.apps/agent-app created
```

Verify read-only filesystem by trying to write to root:

```
kubectl exec -it deployment/agent-app -- sh -c "touch /test.txt"
```

**Output:**

```
Read-only file system
```

But writing to the mounted volume works:

```
kubectl exec -it deployment/agent-app -- sh -c "echo 'test' > /tmp/test.txt && cat /tmp/test.txt"
```

**Output:**

```
test
```

The filesystem is now locked down. Your application can write only to designated temporary locations.

* * *

## Network Policies: Isolating Agent Traffic

The third layer: **Network Policies**. By default, Kubernetes allows all Pods to communicate with each other. A compromised Pod in one namespace could reach Pods in another.

Network Policies enforce segmentation: your agent only receives traffic from authorized namespaces and services.

### Denying All Traffic, Then Allowing Specific Sources

```
# Step 1: Deny all ingress traffic by defaultapiVersion: networking.k8s.io/v1kind: NetworkPolicymetadata:  name: agent-default-deny  namespace: agentsspec:  podSelector: {}  policyTypes:  - Ingress---# Step 2: Allow traffic only from the api-gateway in the ingress namespaceapiVersion: networking.k8s.io/v1kind: NetworkPolicymetadata:  name: agent-allow-from-gateway  namespace: agentsspec:  podSelector:    matchLabels:      app: agent  policyTypes:  - Ingress  ingress:  - from:    - namespaceSelector:        matchLabels:          name: ingress      podSelector:        matchLabels:          app: api-gateway    ports:    - protocol: TCP      port: 8000---# Step 3: Allow agent Pods to reach external APIsapiVersion: networking.k8s.io/v1kind: NetworkPolicymetadata:  name: agent-allow-egress  namespace: agentsspec:  podSelector:    matchLabels:      app: agent  policyTypes:  - Egress  egress:  - to:    - namespaceSelector: {}    ports:    - protocol: TCP      port: 443
```

**What each policy does**:

-   **`agent-default-deny`**: All Pods in the `agents` namespace reject all incoming traffic by default
-   **`agent-allow-from-gateway`**: Only accept traffic from Pods labeled `app: api-gateway` in the `ingress` namespace, on port 8000
-   **`agent-allow-egress`**: Allow agent to initiate outbound connections on port 443 (HTTPS) to external services

The key insight: **explicit allow**. Every connection must match a rule or it's blocked.

First, make sure your namespaces are labeled:

```
kubectl label namespace ingress name=ingresskubectl label namespace agents name=agents
```

**Output:**

```
namespace/ingress labelednamespace/agents labeled
```

Apply the Network Policies:

```
kubectl apply -f agent-network-policy.yaml
```

**Output:**

```
networkpolicy.networking.k8s.io/agent-default-deny creatednetworkpolicy.networking.k8s.io/agent-allow-from-gateway creatednetworkpolicy.networking.k8s.io/agent-allow-egress created
```

Test the policy by trying to reach the agent from an unauthorized Pod:

```
# From a different namespace without permissionkubectl run test-pod --image=curlimages/curl -n other -- sleep 3600kubectl exec test-pod -n other -- curl http://agent-service.agents.svc.cluster.local:8000
```

**Output:**

```
command terminated with exit code 1
```

The connection is denied. But traffic from the authorized gateway succeeds:

```
# From the authorized api-gateway Podkubectl exec deployment/api-gateway -n ingress -- curl http://agent-service.agents.svc.cluster.local:8000/health
```

**Output:**

```
{"status": "healthy", "model": "gpt-4o", "uptime_seconds": 3600}
```

Your agent is now isolated—only authorized services can reach it.

* * *

## Pod Security Standards

Kubernetes provides **Pod Security Standards**—three tiers that codify security best practices. This lesson's agent should adhere to the Restricted standard.

### The Three Standards

Standard

Use Case

Restrictions

**Privileged**

System components needing OS access

None—allows everything

**Baseline**

General-purpose applications

Disallows privileged containers, host access

**Restricted**

High-security applications (agents, APIs handling sensitive data)

Requires non-root, read-only, no privilege escalation, drop all capabilities

Your agent should meet **Restricted** because it handles sensitive data.

### Enforcing Pod Security Standards

Label your namespace to enforce the Restricted standard:

```
kubectl label namespace agents pod-security.kubernetes.io/enforce=restricted
```

**Output:**

```
namespace/agents labeled
```

Now, any Pod in the `agents` namespace that violates Restricted standards is rejected. For example, this Pod would be rejected:

```
apiVersion: v1kind: Podmetadata:  name: violates-pss  namespace: agentsspec:  containers:  - name: app    image: myimage:v1    securityContext:      runAsUser: 0  # root—violates Restricted
```

Apply it:

```
kubectl apply -f violating-pod.yaml
```

**Output:**

```
error: pods "violates-pss" is forbidden: violates PodSecurity "restricted:latest":  allowPrivilegeEscalation != false (container "app" must set allowPrivilegeEscalation to false)  runAsNonRoot != true (container "app" must set runAsNonRoot to true)  securityContext.runAsUser must be > 0
```

The Pod is rejected. Your agent (built with proper SecurityContext) passes validation automatically.

* * *

## Container Image Security: Vulnerability Scanning

The fourth layer: **image security**. Before your container runs, scan it for known vulnerabilities in dependencies.

### Why Scanning Matters

Your agent image includes:

-   Python 3.11 (security updates released regularly)
-   pip packages (FastAPI, NumPy, OpenAI SDK)
-   OS libraries (libssl, libcrypto)

Each could contain CVEs (Common Vulnerabilities and Exposures). Scanning detects them before deployment.

### Tools for Scanning

Popular options:

Tool

Approach

Best For

**Trivy** (Aqua Security)

Container image scanning

Local development, CI/CD pipelines

**Grype** (Anchore)

Vulnerability database

Supply chain security

**Snyk**

SaaS scanning

Developer-first security

**Harbor**

Registry integration

Preventing vulnerable images from being pushed

For this lesson, we use **Trivy** (open-source, easy to integrate).

### Scanning Your Agent Image

Install Trivy (or use Docker image):

```
trivy image myregistry/agent:v1-secure
```

**Output:**

```
myregistry/agent:v1-secure (linux/amd64)==================================Total: 8 Vulnerabilities┌───────────────────────────────────────────┬──────────┬──────────┐│ Library                  │ Vulnerability ID │ Severity │├──────────────────────────┼──────────────────┼──────────┤│ libssl1.1                │ CVE-2023-2976    │ MEDIUM   ││ libcrypto1.1             │ CVE-2023-3817    │ MEDIUM   ││ pip packages             │ CVE-2024-123     │ LOW      │└──────────────────────────┴──────────────────┴──────────┘
```

Most vulnerabilities are in the base Python image. To fix them:

```
FROM python:3.11-slimRUN apt-get update && apt-get upgrade -y
```

Upgrading base packages often resolves vulnerabilities.

### Integration into CI/CD

Add a scanning step to your deployment pipeline:

```
# Before pushing to registrytrivy image --severity HIGH,CRITICAL myregistry/agent:v1if [ $? -ne 0 ]; then  echo "High/critical vulnerabilities found. Fix before deploying."  exit 1fidocker push myregistry/agent:v1
```

This prevents pushing vulnerable images.

* * *

## Putting It All Together: A Secure Agent Deployment

Here's the complete, security-hardened Deployment combining all layers:

```
apiVersion: apps/v1kind: Deploymentmetadata:  name: agent-prod  namespace: agentsspec:  replicas: 3  selector:    matchLabels:      app: agent  template:    metadata:      labels:        app: agent    spec:      securityContext:        runAsNonRoot: true        runAsUser: 1001        fsGroup: 1001      containers:      - name: agent        image: myregistry/agent:v1-secure        securityContext:          readOnlyRootFilesystem: true          allowPrivilegeEscalation: false          capabilities:            drop:              - ALL        resources:          requests:            cpu: 500m            memory: 512Mi          limits:            cpu: 1000m            memory: 1Gi        volumeMounts:        - name: tmp          mountPath: /tmp        - name: logs          mountPath: /var/log/agent        ports:        - containerPort: 8000          name: http        livenessProbe:          httpGet:            path: /health            port: 8000          initialDelaySeconds: 10          periodSeconds: 10      volumes:      - name: tmp        emptyDir: {}      - name: logs        emptyDir: {}---apiVersion: v1kind: Servicemetadata:  name: agent-service  namespace: agentsspec:  selector:    app: agent  type: ClusterIP  ports:  - port: 8000    targetPort: 8000---apiVersion: networking.k8s.io/v1kind: NetworkPolicymetadata:  name: agent-deny-all  namespace: agentsspec:  podSelector: {}  policyTypes:  - Ingress---apiVersion: networking.k8s.io/v1kind: NetworkPolicymetadata:  name: agent-allow-ingress  namespace: agentsspec:  podSelector:    matchLabels:      app: agent  policyTypes:  - Ingress  ingress:  - from:    - namespaceSelector:        matchLabels:          name: ingress
```

Deploy everything:

```
kubectl apply -f agent-production.yaml
```

**Output:**

```
deployment.apps/agent-prod createdservice/agent-service creatednetworkpolicy.networking.k8s.io/agent-deny-all creatednetworkpolicy.networking.k8s.io/agent-allow-ingress created
```

Verify security settings:

```
kubectl get pod -n agents -o jsonpath='{.items[0].spec.securityContext}'
```

**Output:**

```
{"fsGroup":1001,"runAsNonRoot":true,"runAsUser":1001}
```

Your agent is now deployed with:

-   Non-root execution
-   Read-only root filesystem
-   Network isolation
-   Vulnerable images prevented at CI/CD
-   Pod Security Standards enforced

* * *

## Try With AI

**Setup**: You have a running Kubernetes cluster with an agent Deployment (from Lesson 4 or above). Your AI assistant can help audit the deployment for security gaps.

**Task 1: Audit an Existing Deployment for Security**

Describe your current agent Deployment:

```
I have a Deployment running a FastAPI agent in Kubernetes.The Pod spec looks like:spec:  containers:  - name: agent    image: myregistry/agent:v1.0    # No securityContext configured
```

Ask Claude:

```
My agent runs in Kubernetes without security hardening.Help me identify security gaps and prioritize fixes based on impact.
```

Reflect: What vulnerabilities did Claude identify? Which fixes address the highest-risk scenarios first?

**Task 2: Generate Security Configuration**

Ask Claude:

```
Based on our Deployment, generate:1. A secure Dockerfile that creates a non-root user2. SecurityContext settings for the Pod3. A Network Policy isolating the agent to the ingress namespace4. A scanning step for our CI/CD pipeline
```

Reflect: What constraints does Claude ask about? What assumptions does it make?

**Task 3: Validate Against Pod Security Standards**

After applying your security changes, verify compliance:

```
kubectl label namespace agents pod-security.kubernetes.io/enforce=restrictedkubectl apply -f agent-deployment.yaml
```

Ask Claude:

```
I got this error when applying my Pod. Help me understand why it violates Restricted standardand what changes are needed.
```

Your agent is now secure by default, with AI-assisted hardening and validation.

Checking access...

---

Source: https://agentfactory.panaversity.org/docs/06-AI-Cloud-Native-Development/50-kubernetes-for-ai-services