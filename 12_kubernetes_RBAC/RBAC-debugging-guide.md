# Kubernetes RBAC Debugging Guide: Why `kubectl auth can-i` Returns "no"

## The Problem

After creating the following RBAC resources in the `fundtransfer` namespace:

1. A **Role** named `deployer-role`
2. A **ServiceAccount** named `deployer-sa`
3. A **RoleBinding** named `deployer-rolebinding`

Running this command returns `no`:

```bash
kubectl auth can-i create deployments -n fundtransfer --as system:serviceaccount:fundtransfer:deployer
# Response: no

kubectl auth can-i create deployments -n fundtransfer --as system:serviceaccount:fundtransfer:deployer-sa
# Response: no
```

## Root Cause: Name Mismatch in RoleBinding

The issue is a **name mismatch** between the ServiceAccount and the RoleBinding's `subjects` field.

### What Each File Had

| File | Resource | Name |
|------|----------|------|
| `serviceaccount.yaml` | ServiceAccount | `deployer-sa` |
| `rolebindings.yaml` | RoleBinding subject | `deployer` |
| `role.yaml` | Role | `deployer-role` |

### The Broken Chain

Kubernetes RBAC works as a chain: **ServiceAccount <-- RoleBinding --> Role**

```
ServiceAccount          RoleBinding                  Role
(deployer-sa)    -->    subjects.name: deployer  --> deployer-role
      ^                       ^
      |                       |
      +--- MISMATCH! ---------+
```

The RoleBinding's `subjects[0].name` was set to `deployer`, but no ServiceAccount named `deployer` exists. The actual ServiceAccount is named `deployer-sa`. Since these names don't match, Kubernetes never links the ServiceAccount to the Role, and the permissions are never granted.

### Why Both `--as` Commands Failed

1. `--as system:serviceaccount:fundtransfer:deployer`
   - No ServiceAccount named `deployer` exists in the cluster
   - The RoleBinding references `deployer` in subjects, but since the SA doesn't exist, it's a dead reference

2. `--as system:serviceaccount:fundtransfer:deployer-sa`
   - The ServiceAccount `deployer-sa` exists, but the RoleBinding subject references `deployer`, not `deployer-sa`
   - So the RoleBinding never matches this ServiceAccount

## The Fix

The `subjects.name` in the RoleBinding must **exactly match** the ServiceAccount's `metadata.name`.

### Option A: Fix the RoleBinding (recommended)

Change `rolebindings.yaml` subjects name from `deployer` to `deployer-sa`:

```yaml
subjects:
- kind: ServiceAccount
  name: deployer-sa    # Changed from "deployer" to match the ServiceAccount
  namespace: fundtransfer
```

### Option B: Fix the ServiceAccount

Change `serviceaccount.yaml` name from `deployer-sa` to `deployer`:

```yaml
metadata:
  name: deployer       # Changed from "deployer-sa" to match the RoleBinding
  namespace: fundtransfer
```

## How to Verify After Fixing

```bash
# Re-apply the fixed resource
kubectl apply -f rolebindings.yaml -n fundtransfer

# Test - should now return "yes"
kubectl auth can-i create deployments -n fundtransfer --as system:serviceaccount:fundtransfer:deployer-sa

# Test other permissions from the Role
kubectl auth can-i get pods -n fundtransfer --as system:serviceaccount:fundtransfer:deployer-sa
kubectl auth can-i list services -n fundtransfer --as system:serviceaccount:fundtransfer:deployer-sa

# Test a permission NOT in the Role - should return "no"
kubectl auth can-i delete deployments -n fundtransfer --as system:serviceaccount:fundtransfer:deployer-sa
```

## RBAC Debugging Checklist

When `kubectl auth can-i` returns `no` unexpectedly, check these in order:

### 1. Does the ServiceAccount exist?
```bash
kubectl get sa -n fundtransfer
```

### 2. Does the Role exist and have the right permissions?
```bash
kubectl get role -n fundtransfer
kubectl describe role deployer-role -n fundtransfer
```

### 3. Does the RoleBinding exist?
```bash
kubectl get rolebindings -n fundtransfer
kubectl describe rolebinding deployer-rolebinding -n fundtransfer
```

### 4. Do ALL names match across the chain?

| Check | Where | Must Match |
|-------|-------|------------|
| RoleBinding `subjects.name` | rolebinding.yaml | ServiceAccount `metadata.name` |
| RoleBinding `roleRef.name` | rolebinding.yaml | Role `metadata.name` |
| RoleBinding `subjects.namespace` | rolebinding.yaml | ServiceAccount's namespace |
| RoleBinding `metadata.namespace` | rolebinding.yaml | Role's namespace (for Role, not ClusterRole) |
| `--as` flag SA name | kubectl command | ServiceAccount `metadata.name` |
| `--as` flag namespace | kubectl command | ServiceAccount's namespace |

### 5. Is the `--as` flag formatted correctly?
```
system:serviceaccount:<namespace>:<serviceaccount-name>
```

### 6. Are you testing the right verb + resource + apiGroup?
The Role defines permissions per apiGroup. `deployments` are in `apps`, `pods` are in `""` (core).

## Key Takeaway

RBAC is a chain of exact name references. If **any single name** in the chain doesn't match, the entire permission grant silently fails. Kubernetes does not warn you about dangling references — it simply denies access.
