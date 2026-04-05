# 🐳 Docker vs ☸️ Kubernetes — Commands Comparison (Imperative Style)

> A side-by-side reference of commands that serve the **same purpose** in both Docker and Kubernetes.
> All Kubernetes commands use **imperative style** (`kubectl run`, `kubectl create`, `kubectl expose`, etc.)

---

## 📦 Container / Pod Lifecycle

| Purpose | Docker | Kubernetes (Imperative) |
|---------|--------|--------------------------|
| Run a container / pod | `docker run nginx` | `kubectl run nginx --image=nginx` |
| Run with a specific tag | `docker run nginx:1.25` | `kubectl run nginx --image=nginx:1.25` |
| Run with port exposed | `docker run -p 8080:80 nginx` | `kubectl run nginx --image=nginx --port=80` |
| List running containers / pods | `docker ps` | `kubectl get pods` |
| List all namespaces | `docker ps -a` | `kubectl get pods -A` |
| Stop / delete a pod | `docker stop <container>` | `kubectl delete pod nginx` |
| Remove a container / pod | `docker rm <container>` | `kubectl delete pod nginx` |
| Force delete | `docker rm -f <container>` | `kubectl delete pod nginx --grace-period=0 --force` |

---

## 🔍 Inspection & Debugging

| Purpose | Docker | Kubernetes (Imperative) |
|---------|--------|--------------------------|
| View details | `docker inspect <container>` | `kubectl describe pod nginx` |
| View logs | `docker logs <container>` | `kubectl logs nginx` |
| Stream/follow logs | `docker logs -f <container>` | `kubectl logs -f nginx` |
| Logs of previous crash | `docker logs <container>` | `kubectl logs nginx --previous` |
| Shell into container | `docker exec -it <c> bash` | `kubectl exec -it nginx -- bash` |
| Run one-off command | `docker exec <c> ls /app` | `kubectl exec nginx -- ls /app` |
| Shell (sh fallback) | `docker exec -it <c> /bin/sh` | `kubectl exec -it nginx -- /bin/sh` |
| Resource usage | `docker stats` | `kubectl top pods` |
| Node resource usage | N/A | `kubectl top nodes` |

---

## 🌐 Networking & Port Forwarding

| Purpose | Docker | Kubernetes (Imperative) |
|---------|--------|--------------------------|
| Forward a port locally | `docker run -p 8080:80 nginx` | `kubectl port-forward pod/nginx 8080:80` |
| Expose pod as ClusterIP | N/A | `kubectl expose pod nginx --port=80 --target-port=80` |
| Expose pod as NodePort | `docker run -P nginx` | `kubectl expose pod nginx --type=NodePort --port=80` |
| Expose pod as LoadBalancer | N/A | `kubectl expose pod nginx --type=LoadBalancer --port=80` |
| Expose a deployment | N/A | `kubectl expose deployment myapp --port=80 --type=ClusterIP` |
| List services | `docker network ls` | `kubectl get services` |
| Describe a service | `docker network inspect <n>` | `kubectl describe service nginx` |
| Delete a service | `docker network rm <n>` | `kubectl delete service nginx` |

---

## 🚀 Deployments (Scale & Update)

| Purpose | Docker | Kubernetes (Imperative) |
|---------|--------|--------------------------|
| Create a deployment | `docker run nginx` (single) | `kubectl create deployment myapp --image=nginx` |
| Create with replicas | Manual × N | `kubectl create deployment myapp --image=nginx --replicas=3` |
| Scale up/down | Manual × N | `kubectl scale deployment myapp --replicas=5` |
| Update image | `docker stop` + `docker run` | `kubectl set image deployment/myapp nginx=nginx:1.25` |
| Rollback update | Manual | `kubectl rollout undo deployment/myapp` |
| Check rollout status | N/A | `kubectl rollout status deployment/myapp` |
| View rollout history | N/A | `kubectl rollout history deployment/myapp` |
| Pause a rollout | N/A | `kubectl rollout pause deployment/myapp` |
| Resume a rollout | N/A | `kubectl rollout resume deployment/myapp` |
| Delete deployment | `docker stop` + `docker rm` | `kubectl delete deployment myapp` |

---

## ⚙️ Configuration & Environment Variables

| Purpose | Docker | Kubernetes (Imperative) |
|---------|--------|--------------------------|
| Set env variable | `docker run -e KEY=val nginx` | `kubectl set env deployment/myapp KEY=val` |
| View env variables | `docker inspect <c>` | `kubectl set env deployment/myapp --list` |
| Create ConfigMap (literal) | `--env-file .env` | `kubectl create configmap myconfig --from-literal=KEY=val` |
| Create ConfigMap (from file) | `--env-file .env` | `kubectl create configmap myconfig --from-file=app.properties` |
| Create Secret (literal) | `-e PASSWORD=secret` | `kubectl create secret generic mysecret --from-literal=PASSWORD=secret` |
| Create Secret (TLS) | N/A | `kubectl create secret tls mytls --cert=cert.pem --key=key.pem` |
| Create Docker registry secret | `docker login` | `kubectl create secret docker-registry regcred --docker-username=u --docker-password=p --docker-server=registry.io` |
| Delete ConfigMap | N/A | `kubectl delete configmap myconfig` |
| Delete Secret | N/A | `kubectl delete secret mysecret` |

---

## 🗃️ Namespaces

| Purpose | Docker | Kubernetes (Imperative) |
|---------|--------|--------------------------|
| Create isolation group | `docker network create mynet` | `kubectl create namespace myns` |
| List groups | `docker network ls` | `kubectl get namespaces` |
| Run inside a namespace | `docker run --network mynet nginx` | `kubectl run nginx --image=nginx -n myns` |
| Delete namespace | `docker network rm mynet` | `kubectl delete namespace myns` |
| Set default namespace | N/A | `kubectl config set-context --current --namespace=myns` |

---

## 🏷️ Labels & Selectors

| Purpose | Docker | Kubernetes (Imperative) |
|---------|--------|--------------------------|
| Add a label to pod | `docker tag` (image only) | `kubectl label pod nginx env=prod` |
| Remove a label | N/A | `kubectl label pod nginx env-` |
| Filter by label | N/A | `kubectl get pods -l env=prod` |
| Add annotation | N/A | `kubectl annotate pod nginx team=backend` |

---

## 📋 Resource Management

| Purpose | Docker | Kubernetes (Imperative) |
|---------|--------|--------------------------|
| View all resources | `docker ps` | `kubectl get all` |
| View in specific namespace | N/A | `kubectl get all -n myns` |
| View across all namespaces | `docker ps -a` | `kubectl get all -A` |
| Delete all in namespace | N/A | `kubectl delete all --all -n myns` |
| Edit a live resource | N/A | `kubectl edit pod nginx` |
| Patch a resource | N/A | `kubectl patch deployment myapp -p '{"spec":{"replicas":3}}'` |

---

## 🔑 Common Flags Comparison

| Purpose | Docker Flag | kubectl Flag |
|---------|------------|--------------|
| Detached / background | `-d` | *(pods always run in background)* |
| Interactive terminal | `-it` | `-it` (in exec) |
| All namespaces | N/A | `-A` or `--all-namespaces` |
| Specific namespace | N/A | `-n <namespace>` |
| Output as YAML | N/A | `-o yaml` |
| Output as JSON | N/A | `-o json` |
| Wide output (more info) | N/A | `-o wide` |
| Watch/live update | N/A | `-w` or `--watch` |
| Dry run (no changes) | `--dry-run` | `--dry-run=client` |
| Generate YAML from command | N/A | `--dry-run=client -o yaml` |
| Force delete | `-f` | `--grace-period=0 --force` |

---

## 🧠 Key Conceptual Mapping

```
Docker Concept          →   Kubernetes Imperative Command
─────────────────────────────────────────────────────────
docker run              →   kubectl run
docker stop / rm        →   kubectl delete pod
docker exec -it         →   kubectl exec -it
docker logs             →   kubectl logs
docker stats            →   kubectl top pods
docker ps               →   kubectl get pods
docker inspect          →   kubectl describe pod
docker run -p           →   kubectl port-forward  /  kubectl expose
docker run -e           →   kubectl set env
docker run × N          →   kubectl create deployment --replicas=N
docker network create   →   kubectl create namespace
--env-file .env         →   kubectl create configmap / secret
```

---

## ⚡ Full Imperative Cheatsheet

```bash
# ── POD ─────────────────────────────────────────────────────────────────
kubectl run nginx --image=nginx                          # create pod
kubectl run nginx --image=nginx --port=80                # create pod with port
kubectl get pods                                         # list pods
kubectl get pods -A                                      # all namespaces
kubectl get pods -o wide                                 # with node/IP info
kubectl get pods -w                                      # watch live
kubectl describe pod nginx                               # full details + events
kubectl logs nginx                                       # view logs
kubectl logs -f nginx                                    # follow logs
kubectl logs nginx --previous                            # logs of crashed pod
kubectl exec -it nginx -- bash                           # shell into pod
kubectl exec nginx -- ls /app                            # one-off command
kubectl delete pod nginx                                 # delete pod
kubectl delete pod nginx --grace-period=0 --force        # force delete

# ── DEPLOYMENT ──────────────────────────────────────────────────────────
kubectl create deployment myapp --image=nginx            # create
kubectl create deployment myapp --image=nginx --replicas=3
kubectl get deployments                                  # list
kubectl describe deployment myapp                        # details
kubectl scale deployment myapp --replicas=5              # scale
kubectl set image deployment/myapp nginx=nginx:1.25      # update image
kubectl rollout status deployment/myapp                  # watch rollout
kubectl rollout history deployment/myapp                 # history
kubectl rollout undo deployment/myapp                    # rollback
kubectl rollout pause deployment/myapp                   # pause
kubectl rollout resume deployment/myapp                  # resume
kubectl delete deployment myapp                          # delete

# ── SERVICE ─────────────────────────────────────────────────────────────
kubectl expose pod nginx --port=80 --type=ClusterIP
kubectl expose pod nginx --port=80 --type=NodePort
kubectl expose pod nginx --port=80 --type=LoadBalancer
kubectl expose deployment myapp --port=80 --type=NodePort
kubectl get services                                     # list services
kubectl describe service nginx                           # details
kubectl port-forward pod/nginx 8080:80                   # local forward
kubectl port-forward deployment/myapp 8080:80            # forward via deployment
kubectl delete service nginx                             # delete

# ── CONFIGMAP & SECRET ──────────────────────────────────────────────────
kubectl create configmap myconfig --from-literal=KEY=val
kubectl create configmap myconfig --from-file=app.properties
kubectl get configmaps
kubectl describe configmap myconfig
kubectl delete configmap myconfig

kubectl create secret generic mysecret --from-literal=PASS=secret
kubectl create secret tls mytls --cert=cert.pem --key=key.pem
kubectl create secret docker-registry regcred \
  --docker-username=user \
  --docker-password=pass \
  --docker-server=registry.io
kubectl get secrets
kubectl describe secret mysecret
kubectl delete secret mysecret

kubectl set env deployment/myapp KEY=val                 # set env on deployment
kubectl set env deployment/myapp --list                  # view all envs

# ── NAMESPACE ───────────────────────────────────────────────────────────
kubectl create namespace myns
kubectl get namespaces
kubectl run nginx --image=nginx -n myns
kubectl get pods -n myns
kubectl config set-context --current --namespace=myns    # switch default ns
kubectl delete namespace myns

# ── LABELS & ANNOTATIONS ────────────────────────────────────────────────
kubectl label pod nginx env=prod
kubectl label pod nginx env-                             # remove label
kubectl get pods -l env=prod                             # filter by label
kubectl annotate pod nginx team=backend
kubectl annotate pod nginx team-                         # remove annotation

# ── RESOURCE INFO ───────────────────────────────────────────────────────
kubectl get all
kubectl get all -n myns
kubectl get all -A
kubectl get events
kubectl top pods
kubectl top nodes
kubectl delete all --all -n myns                         # delete everything in ns

# ── GENERATE YAML FROM IMPERATIVE (Pro Tip) ─────────────────────────────
kubectl run nginx --image=nginx --dry-run=client -o yaml
kubectl create deployment myapp --image=nginx --replicas=3 --dry-run=client -o yaml
kubectl expose deployment myapp --port=80 --type=NodePort --dry-run=client -o yaml
kubectl create configmap myconfig --from-literal=KEY=val --dry-run=client -o yaml
kubectl create secret generic mysecret --from-literal=PASS=secret --dry-run=client -o yaml
```

---

> 📌 **Imperative vs Declarative Reminder:**
> - **Imperative** = `kubectl run`, `kubectl create`, `kubectl expose`, `kubectl scale` — great for quick tasks, testing, exam (CKA/CKAD), and learning.
> - **Declarative** = `kubectl apply -f file.yaml` — best for production and version control.
> - 💡 **Pro tip:** Append `--dry-run=client -o yaml` to any imperative command to instantly generate its YAML equivalent — no need to write YAML from scratch!