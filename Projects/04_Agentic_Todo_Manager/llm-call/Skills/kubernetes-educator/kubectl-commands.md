# kubectl Commands Reference — All Objects

Quick reference for imperative commands for every Kubernetes object.
For YAML definitions, see objects-reference.md.

## Universal Patterns

```bash
# Get / List
kubectl get <resource>                          # List in default namespace
kubectl get <resource> -n <namespace>           # Specific namespace
kubectl get <resource> -A                       # All namespaces
kubectl get <resource> <name>                   # Specific resource
kubectl get <resource> <name> -o yaml           # As YAML
kubectl get <resource> <name> -o json           # As JSON
kubectl get <resource> -w                       # Watch (live updates)

# Describe (human-readable details + events)
kubectl describe <resource> <name>

# Delete
kubectl delete <resource> <name>
kubectl delete <resource> <name> --grace-period=0 --force  # Immediate

# Apply / Create from file
kubectl apply -f file.yaml
kubectl delete -f file.yaml

# Generate YAML stub without creating
kubectl <command> --dry-run=client -o yaml > out.yaml
```

---

## Namespace
```bash
kubectl create namespace my-ns
kubectl get namespaces              # or: ns
kubectl delete namespace my-ns
kubectl config set-context --current --namespace=my-ns  # Switch default ns
```

## Pod
```bash
kubectl run nginx --image=nginx:1.25
kubectl run nginx --image=nginx --port=80
kubectl run nginx --image=nginx --env="VAR=value" --labels="app=nginx"
kubectl run nginx --image=nginx --restart=Never  # Job-style (run once)

kubectl get pods                    # or: po
kubectl get pod nginx -o wide       # Show node + IP
kubectl describe pod nginx          # Details + Events
kubectl logs nginx                  # Stdout logs
kubectl logs nginx --previous       # Previous container logs
kubectl logs nginx -f               # Follow logs
kubectl logs nginx --tail=50        # Last 50 lines
kubectl exec -it nginx -- /bin/bash # Interactive shell
kubectl exec nginx -- env           # Run single command
kubectl port-forward pod/nginx 8080:80

kubectl delete pod nginx
kubectl delete pod nginx --grace-period=0 --force  # Force delete

# Generate pod YAML
kubectl run nginx --image=nginx --dry-run=client -o yaml > pod.yaml
```

## Deployment
```bash
kubectl create deployment my-app --image=myapp:v1
kubectl create deployment my-app --image=myapp:v1 --replicas=3
kubectl create deployment my-app --image=myapp:v1 --port=8080

kubectl get deployments             # or: deploy
kubectl describe deployment my-app
kubectl scale deployment my-app --replicas=5
kubectl set image deployment/my-app app=myapp:v2   # Rolling update
kubectl rollout status deployment/my-app
kubectl rollout history deployment/my-app
kubectl rollout undo deployment/my-app
kubectl rollout undo deployment/my-app --to-revision=2
kubectl rollout pause deployment/my-app
kubectl rollout resume deployment/my-app
kubectl delete deployment my-app

# Generate YAML
kubectl create deployment my-app --image=myapp --dry-run=client -o yaml > deploy.yaml
```

## Service
```bash
# Expose a deployment
kubectl expose deployment my-app --type=ClusterIP --port=80 --target-port=8080
kubectl expose deployment my-app --type=NodePort --port=80 --target-port=8080
kubectl expose deployment my-app --type=LoadBalancer --port=80

# Create directly
kubectl create service clusterip my-svc --tcp=80:8080
kubectl create service nodeport my-svc --tcp=80:8080 --node-port=30080
kubectl create service loadbalancer my-svc --tcp=80:8080
kubectl create service externalname my-svc --external-name=api.example.com

kubectl get services                # or: svc
kubectl describe service my-svc
kubectl delete service my-svc
kubectl port-forward svc/my-svc 8080:80
```

## ConfigMap
```bash
kubectl create configmap app-config \
  --from-literal=APP_ENV=production \
  --from-literal=LOG_LEVEL=info

kubectl create configmap app-config --from-file=app.conf
kubectl create configmap app-config --from-file=config/    # All files in dir
kubectl create configmap app-config --from-env-file=.env

kubectl get configmaps              # or: cm
kubectl describe configmap app-config
kubectl edit configmap app-config   # Live edit
kubectl delete configmap app-config
```

## Secret
```bash
kubectl create secret generic db-secret \
  --from-literal=username=admin \
  --from-literal=password=secret123

kubectl create secret generic db-secret --from-file=credentials.txt
kubectl create secret tls my-tls --cert=server.crt --key=server.key
kubectl create secret docker-registry regcred \
  --docker-server=registry.example.com \
  --docker-username=user \
  --docker-password=pass

kubectl get secrets
kubectl describe secret db-secret   # Shows types, NOT values
kubectl get secret db-secret -o jsonpath='{.data.password}' | base64 -d
kubectl delete secret db-secret
```

## PersistentVolume & PersistentVolumeClaim
```bash
# No good imperative commands — use YAML files
kubectl get persistentvolumes       # or: pv
kubectl get persistentvolumeclaims  # or: pvc
kubectl describe pv my-pv
kubectl describe pvc my-pvc
kubectl delete pvc my-pvc
kubectl get storageclasses          # or: sc
```

## Job
```bash
kubectl create job data-job --image=python:3.11 -- python process.py
kubectl create job copy-job --from=cronjob/daily-job  # Manual trigger from CronJob

kubectl get jobs
kubectl describe job data-job
kubectl logs job/data-job
kubectl delete job data-job
```

## CronJob
```bash
kubectl create cronjob daily-job \
  --image=busybox \
  --schedule="0 2 * * *" \
  -- echo "hello"

kubectl get cronjobs                # or: cj
kubectl describe cronjob daily-job
kubectl delete cronjob daily-job

# Manually trigger a CronJob
kubectl create job --from=cronjob/daily-job manual-run-001
```

## DaemonSet
```bash
# No direct imperative create — use YAML
kubectl get daemonsets              # or: ds
kubectl describe daemonset log-collector
kubectl rollout status daemonset/log-collector
kubectl rollout undo daemonset/log-collector
kubectl delete daemonset log-collector
```

## StatefulSet
```bash
# No direct imperative create — use YAML
kubectl get statefulsets            # or: sts
kubectl describe statefulset my-db
kubectl scale statefulset my-db --replicas=5
kubectl rollout status statefulset/my-db
kubectl delete statefulset my-db
kubectl delete statefulset my-db --cascade=orphan  # Keep pods running!
```

## Ingress
```bash
kubectl create ingress my-ingress \
  --rule="example.com/api=api-svc:80" \
  --rule="example.com/=frontend-svc:80"

kubectl create ingress my-ingress \
  --rule="example.com/=my-svc:80,tls=my-tls-secret"

kubectl get ingress                 # or: ing
kubectl describe ingress my-ingress
kubectl delete ingress my-ingress
```

## NetworkPolicy
```bash
# No imperative command — use YAML
kubectl get networkpolicies         # or: netpol
kubectl describe networkpolicy my-policy
kubectl delete networkpolicy my-policy
```

## ServiceAccount
```bash
kubectl create serviceaccount my-app-sa
kubectl get serviceaccounts         # or: sa
kubectl describe serviceaccount my-app-sa
kubectl delete serviceaccount my-app-sa
```

## RBAC
```bash
# Role
kubectl create role pod-reader \
  --verb=get,list,watch \
  --resource=pods

kubectl create role deployment-manager \
  --verb=get,list,create,update,patch,delete \
  --resource=deployments,replicasets

# ClusterRole
kubectl create clusterrole node-reader \
  --verb=get,list,watch \
  --resource=nodes

# RoleBinding
kubectl create rolebinding dev-binding \
  --role=pod-reader \
  --user=jane

kubectl create rolebinding sa-binding \
  --role=pod-reader \
  --serviceaccount=default:my-app-sa

# ClusterRoleBinding
kubectl create clusterrolebinding admin-binding \
  --clusterrole=cluster-admin \
  --user=admin

# Test permissions
kubectl auth can-i get pods
kubectl auth can-i get pods --as=jane
kubectl auth can-i get pods --as=system:serviceaccount:default:my-app-sa -n default
kubectl auth can-i '*' '*'  # Check if you have all permissions

kubectl get roles,rolebindings
kubectl get clusterroles,clusterrolebindings
```

## HorizontalPodAutoscaler
```bash
kubectl autoscale deployment my-app \
  --min=2 \
  --max=10 \
  --cpu-percent=70

kubectl get hpa
kubectl describe hpa my-app
kubectl delete hpa my-app
```

## ResourceQuota & LimitRange
```bash
# No clean imperative commands — use YAML
kubectl get resourcequotas          # or: quota
kubectl get limitranges
kubectl describe quota my-quota
kubectl describe limitrange my-limits
```

## Node Management
```bash
kubectl get nodes
kubectl get nodes -o wide
kubectl describe node <node-name>
kubectl cordon <node-name>          # Mark unschedulable
kubectl uncordon <node-name>        # Mark schedulable again
kubectl drain <node-name>           # Evict pods + cordon (for maintenance)
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data
kubectl taint nodes <node-name> key=value:NoSchedule
kubectl taint nodes <node-name> key:NoSchedule-   # Remove taint
kubectl label node <node-name> disktype=ssd
```
