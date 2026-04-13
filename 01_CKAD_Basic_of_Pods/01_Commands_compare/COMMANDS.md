# 🐳 Docker vs ☸️ Kubernetes — Commands Comparison

> A side-by-side reference of commands that serve the **same purpose** in both Docker and Kubernetes.

---

## 📦 Container / Pod Lifecycle

| Purpose | Docker | Kubernetes |
|---------|--------|------------|
| Run a container / pod | `docker run nginx` | `kubectl run nginx --image=nginx` |
| List running containers / pods | `docker ps` | `kubectl get pods` |
| List all (incl. stopped) | `docker ps -a` | `kubectl get pods -A` |
| Stop a container / pod | `docker stop <container>` | `kubectl delete pod <pod>` |
| Remove a container / pod | `docker rm <container>` | `kubectl delete pod <pod>` |
| Restart a container | `docker restart <container>` | `kubectl rollout restart deployment/<name>` |

---

## 🔍 Inspection & Debugging

| Purpose | Docker | Kubernetes |
|---------|--------|------------|
| View container/pod details | `docker inspect <container>` | `kubectl describe pod <pod>` |
| View logs | `docker logs <container>` | `kubectl logs <pod>` |
| Stream/follow logs | `docker logs -f <container>` | `kubectl logs -f <pod>` |
| Execute command inside | `docker exec -it <container> bash` | `kubectl exec -it <pod> -- bash` |
| Open interactive shell | `docker exec -it <container> /bin/sh` | `kubectl exec -it <pod> -- /bin/sh` |
| View resource usage/stats | `docker stats` | `kubectl top pods` |

---

## 🌐 Networking & Port Forwarding

| Purpose | Docker | Kubernetes |
|---------|--------|------------|
| Map / forward a port | `docker run -p 8080:80 nginx` | `kubectl port-forward pod/<pod> 8080:80` |
| Expose a service | `docker run -P nginx` | `kubectl expose pod <pod> --port=80` |
| View network info | `docker network ls` | `kubectl get services` |

---

## 📁 Images & Registries

| Purpose | Docker | Kubernetes |
|---------|--------|------------|
| Pull an image | `docker pull nginx:latest` | *(defined in YAML `image:` field)* |
| List images | `docker images` | `kubectl get pods -o jsonpath='{..image}'` |
| Tag an image | `docker tag myapp:v1 myapp:latest` | *(done in Docker before pushing)* |
| Push image to registry | `docker push myrepo/myapp:v1` | *(done in Docker before deploying)* |

---

## ⚙️ Configuration & Environment Variables

| Purpose | Docker | Kubernetes |
|---------|--------|------------|
| Set env variable | `docker run -e ENV_VAR=value nginx` | `kubectl set env deployment/<name> KEY=VALUE` |
| Mount a volume | `docker run -v /host:/container nginx` | *(defined via PVC + volumeMounts in YAML)* |
| Pass config file | `docker run --env-file .env nginx` | ConfigMap / Secret mounted as env or volume |

---

## 🔁 Scaling & Replicas

| Purpose | Docker | Kubernetes |
|---------|--------|------------|
| Run multiple instances | `docker run` × N times manually | `kubectl scale deployment/<name> --replicas=3` |
| Update/redeploy container | `docker stop` + `docker run` (new image) | `kubectl set image deployment/<name> container=image:tag` |
| Rollback update | Manual (stop new, start old) | `kubectl rollout undo deployment/<name>` |
| Check rollout status | N/A | `kubectl rollout status deployment/<name>` |

---

## 🗃️ Volumes & Storage

| Purpose | Docker | Kubernetes |
|---------|--------|------------|
| Create a volume | `docker volume create myvol` | `kubectl apply -f pvc.yaml` (PersistentVolumeClaim) |
| List volumes | `docker volume ls` | `kubectl get pv,pvc` |
| Remove volume | `docker volume rm myvol` | `kubectl delete pvc <name>` |
| Inspect volume | `docker volume inspect myvol` | `kubectl describe pvc <name>` |

---

## 🏷️ Namespaces / Isolation

| Purpose | Docker | Kubernetes |
|---------|--------|------------|
| Logical grouping/isolation | `docker network create mynet` | `kubectl create namespace myns` |
| List groups | `docker network ls` | `kubectl get namespaces` |
| Run in a group | `docker run --network mynet nginx` | `kubectl run nginx --image=nginx -n myns` |

---

## 📋 Apply / Compose Configuration

| Purpose | Docker | Kubernetes |
|---------|--------|------------|
| Declare multi-container setup | `docker-compose.yml` | `deployment.yaml` / `pod.yaml` |
| Apply/start configuration | `docker compose up` | `kubectl apply -f manifest.yaml` |
| Stop/remove configuration | `docker compose down` | `kubectl delete -f manifest.yaml` |
| Validate config syntax | `docker compose config` | `kubectl apply --dry-run=client -f manifest.yaml` |

---

## 🔑 Common Flags Comparison

| Purpose | Docker Flag | kubectl Flag |
|---------|------------|--------------|
| Detached / background | `-d` | *(pods always run in background)* |
| Interactive terminal | `-it` | `-it` (in exec) |
| All namespaces | N/A | `-A` or `--all-namespaces` |
| Specific namespace | N/A | `-n <namespace>` |
| Output format | `--format` | `-o yaml` / `-o json` / `-o wide` |
| Watch/live update | N/A | `-w` or `--watch` |
| Dry run (no apply) | `--dry-run` | `--dry-run=client` |
| Generate YAML stub | N/A | `-o yaml` + `--dry-run=client` |

---

## 🧠 Key Conceptual Mapping

```
Docker Concept          →   Kubernetes Equivalent
──────────────────────────────────────────────────
Container               →   Container (inside a Pod)
docker run              →   Pod / Deployment
docker-compose.yml      →   YAML Manifest (Deployment, Service)
docker compose up       →   kubectl apply -f
docker compose down     →   kubectl delete -f
Port mapping (-p)       →   Service (NodePort/LoadBalancer) / port-forward
Volume (-v)             →   PersistentVolume + PersistentVolumeClaim
Environment var (-e)    →   ConfigMap / Secret / env in pod spec
Network                 →   Service + Namespace + NetworkPolicy
docker stats            →   kubectl top pods/nodes
```

---

## ⚡ Quick Cheatsheet

```bash
# Run a container
docker run nginx                         # Docker
kubectl run nginx --image=nginx          # Kubernetes

# Shell into running container
docker exec -it mycontainer bash         # Docker
kubectl exec -it mypod -- bash           # Kubernetes

# View logs
docker logs mycontainer                  # Docker
kubectl logs mypod                       # Kubernetes

# Apply a config file
docker compose up -f docker-compose.yml  # Docker
kubectl apply -f deployment.yaml         # Kubernetes

# Scale
docker run ... (manual x3)               # Docker (manual)
kubectl scale deploy/myapp --replicas=3  # Kubernetes

# Port forward
docker run -p 8080:80 nginx              # Docker
kubectl port-forward pod/mypod 8080:80  # Kubernetes
```

---

> 📌 **Note:** Docker manages **single-host** containers. Kubernetes orchestrates containers **across a cluster** of many machines — adding self-healing, auto-scaling, service discovery, and more.