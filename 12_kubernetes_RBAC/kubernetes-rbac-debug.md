# Kubernetes RBAC Debugging: Why `kubectl auth can-i` Returns `no`

## Overview

Despite creating a Role, ServiceAccount, and RoleBinding in the `fundtransfer` namespace, the
authorization check returned `no`. There are **two root causes** — one is a missing apply, the
other is a name mismatch. Both must be fixed together.

---

## Root Cause #1 — The Role Was Never Applied (Critical)

### What happened

Look carefully at `commands.md`. Every time `role.yaml` was used, it had the `--dry-run=client` flag:

```bash
kubectl apply -f role.yaml --dry-run=client -o yaml   ← DRY RUN ONLY
k apply -f role.yaml --dry-run=client -o yaml          ← DRY RUN ONLY AGAIN
```

The `--dry-run=client` flag tells kubectl to **simulate** the apply locally and print what
**would** happen — without ever sending anything to the Kubernetes API server.

The Role `deployer-role` was **never actually created** in the cluster.

### What this means

The RoleBinding (`deployer-rolebinding`) references a Role named `deployer-role`. When the
authorization engine evaluates a permission, it looks up that Role to find what verbs are allowed.
Since the Role doesn't exist, the binding effectively points to nothing, and all checks return `no`.

### The Fix

```bash
# Apply the role WITHOUT --dry-run
kubectl apply -f role.yaml

# Verify it was created
kubectl get role deployer-role -n fundtransfer
kubectl describe role deployer-role -n fundtransfer
```

---

## Root Cause #2 — ServiceAccount Name Mismatch

### What happened

There are three different names in play, and they don't all agree:

| File / Command                        | Name used         |
|---------------------------------------|-------------------|
| `commands.md` (initial create command)| `deployer`        |
| `serviceaccount.yaml` (what was applied) | `deployer-sa`  |
| `rolebindings.yaml` (subjects section)| `deployer`        |
| `kubectl auth can-i` test #1          | `deployer`        |
| `kubectl auth can-i` test #2          | `deployer-sa`     |

### The mismatch explained

The commands log shows the ServiceAccount was generated from a dry-run:

```bash
kubectl create serviceaccount deployer -n fundtransfer --dry-run=client -o yaml > serviceaccount.yaml
```

This would have produced a file with `name: deployer`. But the `serviceaccount.yaml` that was
actually applied has `name: deployer-sa` — meaning it was manually edited to add `-sa` after
the fact.

```yaml
# serviceaccount.yaml (what was applied)
metadata:
  name: deployer-sa   ← this is what exists in the cluster
```

```yaml
# rolebindings.yaml (what the RoleBinding expects)
subjects:
- kind: ServiceAccount
  name: deployer      ← this name does NOT match deployer-sa
```

### Why both test commands fail

| Test command                                          | Reason it returns `no`                                             |
|-------------------------------------------------------|--------------------------------------------------------------------|
| `--as system:serviceaccount:fundtransfer:deployer`    | The RoleBinding subject matches, but the Role doesn't exist yet   |
| `--as system:serviceaccount:fundtransfer:deployer-sa` | The SA exists, but no RoleBinding binds it to any Role            |

### The Fix

**Pick one name and use it consistently across all three files.** The cleanest fix is to align
everything to `deployer-sa` (since that's the SA that was applied):

**Option A — Update the RoleBinding to reference `deployer-sa`:**

```yaml
# rolebindings.yaml — fix the subject name
subjects:
- kind: ServiceAccount
  name: deployer-sa   ← change this to match the actual SA
  namespace: fundtransfer
```

**Option B — Recreate the ServiceAccount as `deployer`** (simpler, no yaml edit needed):

```bash
kubectl delete serviceaccount deployer-sa -n fundtransfer
kubectl create serviceaccount deployer -n fundtransfer
```

---

## Complete Fix: Step-by-Step

Follow these steps in order to get a working RBAC setup.

### Step 1 — Apply the Role (the missing step)

```bash
kubectl apply -f role.yaml
```

### Step 2 — Fix the ServiceAccount name

Choose one of these options:

**Option A** — Edit `rolebindings.yaml` to use `deployer-sa`:

```yaml
subjects:
- kind: ServiceAccount
  name: deployer-sa      # ← was "deployer", now matches the SA
  namespace: fundtransfer
```

Then re-apply the rolebinding:

```bash
kubectl apply -f rolebindings.yaml
```

**Option B** — Recreate the SA with the name `deployer` so the existing RoleBinding works:

```bash
kubectl delete serviceaccount deployer-sa -n fundtransfer
kubectl create serviceaccount deployer -n fundtransfer
```

### Step 3 — Verify all resources exist

```bash
kubectl get role deployer-role -n fundtransfer
kubectl get serviceaccount deployer-sa -n fundtransfer   # or "deployer" if you used Option B
kubectl get rolebinding deployer-rolebinding -n fundtransfer
```

### Step 4 — Re-run the auth check

```bash
# Replace "deployer-sa" with "deployer" if you used Option B
kubectl auth can-i create deployments -n fundtransfer \
  --as system:serviceaccount:fundtransfer:deployer-sa
```

Expected output: **`yes`**

---

## Corrected YAML Files (for reference)

### role.yaml ✅ (no changes needed)

```yaml
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: deployer-role
  namespace: fundtransfer
rules:
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "create", "update", "patch"]
- apiGroups: [""]
  resources: ["pods", "services"]
  verbs: ["get", "list"]
```

### serviceaccount.yaml ✅ (no changes needed, keep deployer-sa)

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: deployer-sa
  namespace: fundtransfer
```

### rolebindings.yaml ✅ (fix: change subject name to deployer-sa)

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: deployer-rolebinding
  namespace: fundtransfer
subjects:
- kind: ServiceAccount
  name: deployer-sa          # ← FIXED: was "deployer", now matches the SA
  namespace: fundtransfer
roleRef:
  kind: Role
  name: deployer-role
  apiGroup: rbac.authorization.k8s.io
```

---

## How Kubernetes RBAC Authorization Works (Mental Model)

```
kubectl auth can-i create deployments --as system:serviceaccount:fundtransfer:deployer-sa
         │
         ▼
 Kubernetes API Server
         │
         ├─ Find all RoleBindings in namespace "fundtransfer"
         │         where subject.kind=ServiceAccount
         │         AND subject.name="deployer-sa"
         │         AND subject.namespace="fundtransfer"
         │
         ├─ Found: deployer-rolebinding  ──references──▶  Role: deployer-role
         │
         └─ Does deployer-role allow VERB=create on RESOURCE=deployments?
                    └─ YES → "yes"
                    └─ NO / Role not found → "no"
```

All three links in this chain must be correct:
1. **The Role must exist** and contain the right rules
2. **The RoleBinding subject name must match** the ServiceAccount name exactly (case-sensitive)
3. **The RoleBinding roleRef must match** the Role name exactly

---

## Key Lessons Learned

| Lesson | Rule |
|--------|------|
| `--dry-run=client` never touches the cluster | Always verify with `kubectl get` after applying |
| Service Account names are case-sensitive | Keep names consistent across all YAML files |
| RoleBindings don't validate subjects exist | Kubernetes won't warn you if the SA name is wrong |
| Apply order matters | Role → ServiceAccount → RoleBinding (role must exist before binding) |

---

## Quick Reference: Useful Debugging Commands

```bash
# Check if a specific resource exists
kubectl get role deployer-role -n fundtransfer
kubectl get sa deployer-sa -n fundtransfer
kubectl get rolebinding deployer-rolebinding -n fundtransfer

# Inspect what a role allows
kubectl describe role deployer-role -n fundtransfer

# Inspect who a rolebinding grants access to
kubectl describe rolebinding deployer-rolebinding -n fundtransfer

# Test authorization for a service account
kubectl auth can-i create deployments -n fundtransfer \
  --as system:serviceaccount:fundtransfer:deployer-sa

# Test authorization for all verbs on deployments
for verb in get list create update patch delete; do
  echo -n "$verb deployments: "
  kubectl auth can-i $verb deployments -n fundtransfer \
    --as system:serviceaccount:fundtransfer:deployer-sa
done
```
