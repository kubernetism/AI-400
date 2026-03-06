# Kubernetes Commands Cheat Sheet

## Cluster Info

```bash
kubectl cluster-info                    # Show cluster endpoint and core services
kubectl cluster-info dump               # Full cluster state dump (very verbose)
kubectl version                         # Show client and server versions
```

## Namespaces

```bash
kubectl get ns                          # List all namespaces
kubectl create ns <name>                # Create a namespace
kubectl delete ns <name>                # Delete a namespace and ALL its resources
```

**Tip:** Deleting a namespace removes everything in it — pods, services, deployments, all of it. No confirmation prompt.

## Pods

```bash
kubectl get pods                        # List pods in default namespace
kubectl get pods -n <namespace>         # List pods in a specific namespace
kubectl get pods -A                     # List pods across ALL namespaces
kubectl describe pod <pod-name>         # Detailed info (events, status, containers)
kubectl logs <pod-name>                 # View pod logs
kubectl delete pod <pod-name>           # Delete a specific pod
```

**Tip:** If a pod is managed by a Deployment, deleting the pod will just respawn a new one. Delete the **Deployment** to stop it permanently.

## Deployments

```bash
kubectl get deployments                 # List all deployments
kubectl delete deployment <name>        # Delete a deployment and its pods
```

## API Resources

```bash
kubectl api-resources                   # List all available resource types
```

**Tip:** Use this when you forget a resource name — shows short names, API group, and whether it's namespaced.

## Common Flags

| Flag | Meaning |
|---|---|
| `-n <namespace>` | Target a specific namespace |
| `-A` / `--all-namespaces` | Show resources across all namespaces |
| `-o wide` | Show extra columns (node, IP, etc.) |
| `-o yaml` | Output full YAML definition |
| `-o json` | Output as JSON |
| `-w` / `--watch` | Watch for real-time changes |

## Useful Aliases (oh-my-zsh kubectl plugin)

| Alias | Command |
|---|---|
| `k` | `kubectl` |
| `kgp` | `kubectl get pods` |
| `kgns` | `kubectl get namespaces` |
| `kgd` | `kubectl get deployments` |
| `kgs` | `kubectl get services` |
| `kdp` | `kubectl describe pod` |
| `kl` | `kubectl logs` |

**Tip:** Enable the `kubectl` plugin in `~/.zshrc` to get these aliases automatically.

## Lessons from Your Terminal History

1. **Pod keeps coming back after delete** — You ran `kubectl delete pod` three times and it kept respawning. That's because the Deployment controller recreates pods automatically. Always delete the **deployment** instead:
   ```bash
   kubectl delete deployment my-app      # This stops pod respawning
   ```

2. **`-n` flag matters** — `kubectl get pods` only shows the `default` namespace. If your pod is in `nginx` namespace, you must specify `-n nginx`.

3. **There is no `kubectl get containers`** — Containers live inside pods. Use `kubectl describe pod <name>` to see container details.

4. **Namespace deletion is destructive** — `kubectl delete ns nginx` wipes everything in that namespace instantly.

5. **Spelling matters** — It's `kubectl`, not `kubeclt`. Enable tab completion to avoid typos:
   ```bash
   # For bash
   source <(kubectl completion bash)

   # For zsh
   source <(kubectl completion zsh)
   ```
