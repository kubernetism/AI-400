# Prompt: Generate Kubernetes RBAC Study Notes

---

## PROMPT 

---

```
You are an expert Kubernetes instructor and technical writer. Generate comprehensive, 
well-structured study notes on Kubernetes Role-Based Access Control (RBAC) — covering 
everything from absolute basics to the most advanced production-grade patterns.

Output a single, complete Markdown document saved as: `kubernetes-rbac-notes.md`

---

## DOCUMENT STRUCTURE REQUIREMENTS

Structure the document with the following major sections in order:

---

### SECTION 1 — FOUNDATIONS (Beginner Level)

Cover these topics with clear explanations:

1. **What is RBAC?**
   - Definition and purpose in Kubernetes
   - Why RBAC exists (security principle of least privilege)
   - History: when RBAC became stable in Kubernetes (v1.8)
   - How RBAC differs from ABAC and Node authorization

2. **Core RBAC Objects — The Four Building Blocks**
   For each of the four objects (Role, ClusterRole, RoleBinding, ClusterRoleBinding), explain:
   - What it is and what problem it solves
   - Scope: namespaced vs cluster-wide
   - When to use each one
   - Full YAML example with every field explained via inline comments

3. **Subjects — Who Gets Access?**
   - Users (how Kubernetes handles user identity — no User object!)
   - ServiceAccounts (what they are, how they're created, auto-mounting)
   - Groups (system:authenticated, system:unauthenticated, system:masters, etc.)
   - Full YAML examples for each subject type in a RoleBinding

4. **Verbs and Resources**
   - Complete table of all verbs: get, list, watch, create, update, patch, delete, deletecollection
   - Common API groups (core "", apps, batch, rbac.authorization.k8s.io, etc.)
   - Resource vs subresource (e.g., pods vs pods/log, pods/exec)
   - Wildcard usage and when NOT to use it

---

### SECTION 2 — INTERMEDIATE CONCEPTS

5. **Namespaced vs Cluster-Wide RBAC**
   - Decision flowchart (described in text/ASCII)
   - Using ClusterRole with RoleBinding (cross-namespace reuse pattern)
   - Real-world scenario comparison table

6. **Built-in ClusterRoles**
   - cluster-admin, admin, edit, view — differences and use cases
   - System roles (system:kube-scheduler, system:node, system:coredns, etc.)
   - How to inspect them with kubectl

7. **ServiceAccount Deep Dive**
   - Default ServiceAccount behavior
   - Creating dedicated ServiceAccounts per workload
   - Disabling auto-mount: `automountServiceAccountToken: false`
   - Projected volumes and token expiry (bound service account tokens)
   - ServiceAccount in Pod spec

8. **ResourceNames — Restricting to Specific Resources**
   - What resourceNames does
   - Limitations of resourceNames
   - YAML example: access to a specific ConfigMap only

---

### SECTION 3 — ADVANCED PATTERNS

9. **Aggregated ClusterRoles**
   - What aggregation rules are and why they're powerful
   - How to create a ClusterRole that auto-aggregates others
   - Label-based aggregation with `aggregationRule`
   - Full YAML example: building a custom composite role
   - Real use case: extending built-in `view` role for CRDs

10. **RBAC for Custom Resources (CRDs)**
    - Why CRDs need explicit RBAC rules
    - Granting access to CRD resources across API groups
    - Full example with a custom resource (e.g., `certificates.cert-manager.io`)

11. **Impersonation**
    - What impersonation is (`--as`, `--as-group` flags)
    - The `impersonate` verb in RBAC rules
    - Security implications and audit trail
    - YAML: granting impersonation rights safely

12. **RBAC for Helm and CI/CD Pipelines**
    - Minimal permissions for Helm installs
    - ServiceAccount for GitHub Actions / ArgoCD / Flux
    - Scoped deploy role example for a CI pipeline

13. **Multi-Tenant RBAC Architecture**
    - Namespace-per-team model
    - Shared ClusterRoles + per-namespace RoleBindings pattern
    - Preventing privilege escalation between tenants
    - Using namespace labels + admission webhooks as RBAC complement

14. **Privilege Escalation Prevention**
    - Why you can't grant permissions you don't have
    - The `escalate` and `bind` verbs — what they allow
    - How Kubernetes enforces this at the API level

---

### SECTION 4 — KUBECTL COMMAND REFERENCE

For EACH topic above, provide the exact kubectl commands. Additionally, compile a 
**complete command cheatsheet** section with all commands grouped by category:

**Discovery & Inspection Commands:**
```bash
# List all roles in a namespace
kubectl get roles -n <namespace>

# List all clusterroles
kubectl get clusterroles

# Describe a specific role
kubectl describe role <role-name> -n <namespace>

# List all rolebindings
kubectl get rolebindings -n <namespace>

# Check what a user/SA can do (auth can-i)
kubectl auth can-i <verb> <resource> --as=<user> -n <namespace>

# List ALL permissions for a subject
kubectl auth can-i --list --as=<user> -n <namespace>

# Check ServiceAccount permissions
kubectl auth can-i list pods \
  --as=system:serviceaccount:<namespace>:<sa-name>
```

**Creation Commands (imperative):**
- Creating Roles, ClusterRoles, RoleBindings, ClusterRoleBindings
- Creating ServiceAccounts
- Binding existing ClusterRoles

**Audit & Debugging Commands:**
- Using `kubectl auth reconcile`
- Finding who has access to what
- Detecting overly-permissive bindings

Include at least 25 distinct kubectl commands with realistic flags and examples.

---

### SECTION 5 — THINKING QUESTIONS

Generate exactly 20 thought-provoking questions designed to deepen understanding.
Format each as:

**Q[N]: [Question]**
> 💡 *Hint: [One-sentence hint that guides thinking without giving the answer]*

Cover these cognitive levels:
- 5 questions: Conceptual understanding ("Why does Kubernetes not have a User object?")
- 5 questions: Scenario-based ("Your pod needs to list secrets in its own namespace only — what's the minimal RBAC config?")
- 5 questions: Debugging/troubleshooting ("A developer says they can't exec into pods even though they have a 'pods' get/list role — why?")
- 5 questions: Architecture/design ("When would you use a ClusterRole bound with a RoleBinding instead of a Role?")

---

### SECTION 6 — MULTIPLE CHOICE QUESTIONS (MCQs)

Generate exactly 25 MCQs covering the entire RBAC topic range (beginner to advanced).

Format each as:

**MCQ [N]: [Question]**

- A) [Option]
- B) [Option]
- C) [Option]
- D) [Option]

<details>
<summary>✅ Answer</summary>
**Correct: [Letter]) [Option]**
Explanation: [2-3 sentence explanation of why this is correct and why others are wrong]
</details>

---

Distribute difficulty: 8 beginner, 10 intermediate, 7 advanced questions.

Topics to cover across MCQs:
- RBAC object types and their scope
- Verb and resource combinations
- ServiceAccount behavior
- Built-in ClusterRoles
- RoleBinding vs ClusterRoleBinding
- auth can-i usage
- Aggregated ClusterRoles
- Privilege escalation rules
- Multi-tenant patterns
- Debugging access issues

---

### SECTION 7 — HANDS-ON EXERCISES

Generate exactly 10 progressively complex exercises.

Format each as:

---
**Exercise [N]: [Title]** `[Beginner/Intermediate/Advanced]`

**Objective:** [What the student will learn]

**Scenario:** [Realistic real-world context]

**Your Task:**
1. [Step-by-step instruction]
2. ...

**Verification Commands:**
```bash
# Commands to verify the exercise is done correctly
```

**Expected Output:**
```
[What the terminal should show on success]
```

**Challenge Extension:** [An optional harder variation]

---

Exercises should cover:
1. Create a read-only role for pods in a namespace (Beginner)
2. Bind a ClusterRole to a ServiceAccount in a specific namespace (Beginner)
3. Create a developer role with full access except delete (Intermediate)
4. Configure a pod to use a custom ServiceAccount with minimal permissions (Intermediate)
5. Use auth can-i to audit and fix a broken deployment (Intermediate)
6. Build an aggregated ClusterRole for a CRD (Advanced)
7. Set up RBAC for a CI/CD ServiceAccount (Advanced)
8. Implement namespace-isolation RBAC for two teams (Advanced)
9. Detect and fix a privilege escalation vulnerability (Advanced)
10. Create a full multi-tenant RBAC architecture from scratch (Advanced)

---

### SECTION 8 — QUICK REFERENCE CARD

End the document with a condensed 1-page cheat sheet containing:
- RBAC object comparison table (Role vs ClusterRole vs RoleBinding vs ClusterRoleBinding)
- All verbs with descriptions
- Common built-in ClusterRoles comparison
- The 5 most important `kubectl auth can-i` patterns
- Top 5 RBAC security best practices

---

## OUTPUT REQUIREMENTS

- Format: Valid Markdown with proper heading hierarchy (H1 > H2 > H3)
- Use tables where comparisons are needed
- Use fenced code blocks with language tags (```yaml, ```bash)
- Use emoji section markers (🔐 🛡️ ⚙️ 🧪 💡 ✅) for visual scanning
- All YAML examples must be complete and copy-paste ready
- Minimum length: 4000 lines
- Every YAML example must include `apiVersion`, `kind`, `metadata`, `spec`
- Include a Table of Contents at the top with anchor links
- Add a "Prerequisites" section at the very beginning
- Add a "Further Reading" section at the very end with official docs links

Save the final output to: `kubernetes-rbac-notes.md`
```

---

## 💡 HOW TO USE THIS PROMPT

1. Open **Claude Code** in your terminal:
   ```bash
   claude
   ```

2. Paste the entire prompt above (between the triple backticks)

3. Claude Code will generate and save `kubernetes-rbac-notes.md` in your current directory

4. To also generate a PDF version, append to the prompt:
   ```
   Also convert the markdown to a styled PDF saved as kubernetes-rbac-notes.pdf
   using a tool like pandoc or weasyprint.
   ```

5. To get an interactive HTML version with collapsible sections, append:
   ```
   Also create kubernetes-rbac-notes.html with a sidebar TOC, 
   syntax-highlighted code blocks, and collapsible answer sections.
   ```

---

## 🗂️ EXPECTED OUTPUT FILES

| File | Description |
|------|-------------|
| `kubernetes-rbac-notes.md` | Full study notes (4000+ lines) |
| `kubernetes-rbac-notes.pdf` | *(optional)* Printable PDF |
| `kubernetes-rbac-notes.html` | *(optional)* Interactive HTML |

---

*Prompt crafted for Claude Code — optimized for completeness, accuracy, and study effectiveness.*