import { useState } from "react";

const SECTIONS = [
  { id: "intro", label: "📖 Introduction" },
  { id: "why", label: "❓ Why & Where" },
  { id: "concepts", label: "🧩 Core Concepts" },
  { id: "implement", label: "⚙️ Implementation" },
  { id: "advanced", label: "🚀 Advanced" },
  { id: "qa", label: "💡 Q & A" },
  { id: "exercises", label: "🏋️ Exercises" },
  { id: "mcq", label: "📝 MCQ Quiz" },
];

const CodeBlock = ({ code, lang = "yaml" }) => (
  <pre
    style={{
      background: "#0d1117",
      border: "1px solid #30363d",
      borderRadius: "8px",
      padding: "16px",
      overflowX: "auto",
      fontSize: "13px",
      lineHeight: "1.6",
      color: "#e6edf3",
      fontFamily: "'Fira Code', 'Cascadia Code', monospace",
      margin: "12px 0",
    }}
  >
    <span style={{ color: "#7d8590", fontSize: "11px", display: "block", marginBottom: "8px" }}>
      {lang}
    </span>
    {code}
  </pre>
);

const InfoBox = ({ type = "info", title, children }) => {
  const styles = {
    info:    { border: "#388bfd", bg: "#051d4d", icon: "ℹ️" },
    warning: { border: "#d29922", bg: "#2d1f00", icon: "⚠️" },
    tip:     { border: "#3fb950", bg: "#051a0f", icon: "💡" },
    danger:  { border: "#f85149", bg: "#2a0c0c", icon: "🚫" },
  };
  const s = styles[type];
  return (
    <div style={{
      border: `1px solid ${s.border}`,
      background: s.bg,
      borderRadius: "8px",
      padding: "14px 16px",
      margin: "12px 0",
    }}>
      <div style={{ color: s.border, fontWeight: 700, marginBottom: "6px", fontFamily: "monospace" }}>
        {s.icon} {title}
      </div>
      <div style={{ color: "#c9d1d9", fontSize: "14px", lineHeight: "1.7" }}>{children}</div>
    </div>
  );
};

const Badge = ({ text, color = "#388bfd" }) => (
  <span style={{
    background: color + "22",
    border: `1px solid ${color}`,
    color: color,
    borderRadius: "4px",
    padding: "2px 8px",
    fontSize: "11px",
    fontFamily: "monospace",
    marginRight: "6px",
  }}>{text}</span>
);

const SectionHeader = ({ title, subtitle }) => (
  <div style={{ marginBottom: "24px", borderBottom: "1px solid #21262d", paddingBottom: "16px" }}>
    <h2 style={{ color: "#58a6ff", fontFamily: "'Fira Code', monospace", fontSize: "22px", margin: 0 }}>
      {title}
    </h2>
    {subtitle && <p style={{ color: "#8b949e", margin: "6px 0 0 0", fontSize: "14px" }}>{subtitle}</p>}
  </div>
);

// ─── SECTIONS ───────────────────────────────────────────────────────────────

function IntroSection() {
  return (
    <div>
      <SectionHeader title="Introduction to Role Bindings" subtitle="The glue between permissions and identities in Kubernetes RBAC" />

      <InfoBox type="info" title="What is RBAC?">
        Role-Based Access Control (RBAC) is a Kubernetes authorization mechanism that regulates access to cluster
        resources based on the roles of individual users, groups, or service accounts. Enabled via the
        <code style={{ background: "#161b22", padding: "1px 6px", borderRadius: "3px", margin: "0 4px", color: "#79c0ff" }}>--authorization-mode=RBAC</code>
        flag on the API server. It has been stable (GA) since Kubernetes v1.8.
      </InfoBox>

      <h3 style={{ color: "#e6edf3", fontSize: "16px" }}>The RBAC Building Blocks</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", margin: "12px 0" }}>
        {[
          { name: "Role", scope: "Namespaced", desc: "Defines a set of allowed API operations (verbs) on specific resources within a namespace.", color: "#3fb950" },
          { name: "ClusterRole", scope: "Cluster-wide", desc: "Like Role but applies cluster-wide. Also used for non-namespaced resources (nodes, PVs).", color: "#58a6ff" },
          { name: "RoleBinding", scope: "Namespaced", desc: "Grants a Role OR ClusterRole to subjects (users, groups, ServiceAccounts) in a namespace.", color: "#f0883e" },
          { name: "ClusterRoleBinding", scope: "Cluster-wide", desc: "Grants a ClusterRole to subjects across the entire cluster.", color: "#bc8cff" },
        ].map(b => (
          <div key={b.name} style={{ background: "#161b22", border: `1px solid ${b.color}44`, borderRadius: "8px", padding: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ color: b.color, fontWeight: 700, fontFamily: "monospace", fontSize: "15px" }}>{b.name}</span>
              <Badge text={b.scope} color={b.color} />
            </div>
            <p style={{ color: "#8b949e", margin: 0, fontSize: "13px", lineHeight: "1.6" }}>{b.desc}</p>
          </div>
        ))}
      </div>

      <h3 style={{ color: "#e6edf3", fontSize: "16px" }}>What is a RoleBinding?</h3>
      <p style={{ color: "#c9d1d9", lineHeight: "1.8", fontSize: "14px" }}>
        A <strong style={{ color: "#f0883e" }}>RoleBinding</strong> is a Kubernetes object that <em>binds</em> a Role (or ClusterRole) to one or more
        <strong style={{ color: "#58a6ff" }}> subjects</strong>. Think of it as the bridge: Roles define <em>what can be done</em>,
        and RoleBindings define <em>who can do it</em>.
      </p>

      <CodeBlock lang="kubectl explain rolebindings" code={`KIND:       RoleBinding
VERSION:    rbac.authorization.k8s.io/v1

DESCRIPTION:
  RoleBinding references a role, but does not contain it. It can reference a
  Role in the same namespace or a ClusterRole in the global namespace.

FIELDS:
  apiVersion    <string>       rbac.authorization.k8s.io/v1
  kind          <string>       RoleBinding
  metadata      <ObjectMeta>   Standard object metadata (name, namespace, labels...)
  roleRef       <RoleRef>      Reference to the Role or ClusterRole being bound (IMMUTABLE)
  subjects      <[]Subject>    List of subjects (users, groups, serviceaccounts)`} />

      <InfoBox type="warning" title="Key Constraint: roleRef is Immutable">
        Once a RoleBinding is created, its <code>roleRef</code> field cannot be changed. To change the role being bound,
        you must delete the RoleBinding and create a new one.
      </InfoBox>

      <h3 style={{ color: "#e6edf3", fontSize: "16px" }}>Kubernetes Auth Flow (Simplified)</h3>
      <div style={{
        background: "#0d1117", border: "1px solid #30363d", borderRadius: "8px",
        padding: "20px", fontFamily: "monospace", fontSize: "13px", color: "#8b949e",
        margin: "12px 0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {["kubectl / API call", "→", "Authentication (Who are you?)", "→", "Authorization / RBAC (Are you allowed?)", "→", "Admission Control", "→", "etcd / Action"].map((s, i) => (
            <span key={i} style={{ color: s === "→" ? "#30363d" : i % 2 === 0 ? "#58a6ff" : "#e6edf3" }}>{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function WhySection() {
  return (
    <div>
      <SectionHeader title="Why & Where We Need Role Bindings" subtitle="Real-world motivations and common use cases" />

      <h3 style={{ color: "#e6edf3", fontSize: "16px" }}>The Problem Without RBAC</h3>
      <InfoBox type="danger" title="Without RBAC — Everything or Nothing">
        Without RBAC, you either give a user full cluster-admin access OR nothing. This violates the
        Principle of Least Privilege (PoLP) and is a critical security risk in production.
      </InfoBox>

      <h3 style={{ color: "#e6edf3", fontSize: "16px", marginTop: "20px" }}>Why We Need RoleBindings</h3>
      <div style={{ display: "grid", gap: "10px" }}>
        {[
          { icon: "🔒", title: "Least Privilege Enforcement", desc: "Grant only the minimum permissions needed. A developer should read Pods but not delete them in production." },
          { icon: "👥", title: "Multi-Team Environments", desc: "Team A owns namespace 'frontend', Team B owns 'backend'. Each team gets access only to their namespace." },
          { icon: "🤖", title: "Service Account Isolation", desc: "Pods (via ServiceAccounts) need API access. A monitoring pod needs read-only access; a controller needs write access. Scope it precisely." },
          { icon: "🏢", title: "Multi-Tenancy", desc: "Different customers or departments share a cluster. RoleBindings enforce hard boundaries between tenants." },
          { icon: "✅", title: "Audit & Compliance", desc: "SOC2, HIPAA, PCI-DSS require demonstrable access controls. RBAC + RoleBindings provide the audit trail." },
          { icon: "🛡️", title: "Blast Radius Reduction", desc: "If credentials are compromised, RBAC limits what the attacker can do to the permissions of that identity." },
        ].map(item => (
          <div key={item.title} style={{
            background: "#161b22", borderRadius: "8px", padding: "14px",
            border: "1px solid #21262d", display: "flex", gap: "14px", alignItems: "flex-start",
          }}>
            <span style={{ fontSize: "22px" }}>{item.icon}</span>
            <div>
              <div style={{ color: "#e6edf3", fontWeight: 600, marginBottom: "4px" }}>{item.title}</div>
              <div style={{ color: "#8b949e", fontSize: "13px", lineHeight: "1.6" }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ color: "#e6edf3", fontSize: "16px", marginTop: "24px" }}>Where RoleBindings Are Used</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ background: "#161b22" }}>
            {["Scenario", "Subject Type", "Binding Type", "Scope"].map(h => (
              <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#58a6ff", fontFamily: "monospace", borderBottom: "1px solid #30363d" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            ["Developer accessing staging namespace", "User", "RoleBinding", "Namespace"],
            ["CI/CD pipeline deploying apps", "ServiceAccount", "RoleBinding", "Namespace"],
            ["Monitoring tool (Prometheus) reading pods", "ServiceAccount", "ClusterRoleBinding", "Cluster"],
            ["Ops team viewing all namespaces", "Group", "ClusterRoleBinding", "Cluster"],
            ["Ingress controller managing services", "ServiceAccount", "ClusterRoleBinding", "Cluster"],
            ["App reading its own ConfigMap", "ServiceAccount", "RoleBinding", "Namespace"],
          ].map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #21262d" }}>
              {row.map((cell, j) => (
                <td key={j} style={{
                  padding: "10px 14px", color: j === 0 ? "#c9d1d9" : j === 2 ? "#f0883e" : "#8b949e",
                  fontFamily: j > 0 ? "monospace" : "inherit",
                }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConceptsSection() {
  return (
    <div>
      <SectionHeader title="Core Concepts Deep Dive" subtitle="Subjects, verbs, resources, and the anatomy of RBAC objects" />

      <h3 style={{ color: "#e6edf3", fontSize: "16px" }}>Subjects — The "Who"</h3>
      <p style={{ color: "#c9d1d9", fontSize: "14px", lineHeight: "1.7" }}>
        A subject is the entity being granted permissions. Three types exist:
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", margin: "12px 0" }}>
        {[
          { kind: "User", desc: "Human identity. Authenticated by certificates, OIDC, webhook, etc. Not stored in Kubernetes — external.", color: "#3fb950", ex: 'name: "alice"' },
          { kind: "Group", desc: "Collection of users. system:masters gives cluster-admin. Custom groups set by the auth provider.", color: "#58a6ff", ex: 'name: "dev-team"' },
          { kind: "ServiceAccount", desc: "Identity for pods/processes inside the cluster. Stored as a K8s object. Has a namespace.", color: "#f0883e", ex: 'name: "my-sa"\nnamespace: "default"' },
        ].map(s => (
          <div key={s.kind} style={{ background: "#161b22", border: `1px solid ${s.color}44`, borderRadius: "8px", padding: "14px" }}>
            <div style={{ color: s.color, fontWeight: 700, fontFamily: "monospace", fontSize: "15px", marginBottom: "6px" }}>{s.kind}</div>
            <p style={{ color: "#8b949e", fontSize: "12px", lineHeight: "1.6", margin: "0 0 8px 0" }}>{s.desc}</p>
            <pre style={{ background: "#0d1117", padding: "8px", borderRadius: "4px", margin: 0, fontSize: "11px", color: "#79c0ff" }}>{s.ex}</pre>
          </div>
        ))}
      </div>

      <h3 style={{ color: "#e6edf3", fontSize: "16px", marginTop: "20px" }}>Verbs — The "What Actions"</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", margin: "10px 0" }}>
        {[
          { v: "get", c: "#3fb950" }, { v: "list", c: "#3fb950" }, { v: "watch", c: "#3fb950" },
          { v: "create", c: "#58a6ff" }, { v: "update", c: "#58a6ff" }, { v: "patch", c: "#58a6ff" },
          { v: "delete", c: "#f85149" }, { v: "deletecollection", c: "#f85149" },
          { v: "use", c: "#d29922" }, { v: "bind", c: "#d29922" }, { v: "escalate", c: "#d29922" },
          { v: "*", c: "#bc8cff" },
        ].map(item => (
          <span key={item.v} style={{
            background: item.c + "22", border: `1px solid ${item.c}`, color: item.c,
            padding: "4px 12px", borderRadius: "4px", fontFamily: "monospace", fontSize: "12px",
          }}>{item.v}</span>
        ))}
      </div>

      <h3 style={{ color: "#e6edf3", fontSize: "16px", marginTop: "20px" }}>Resources & API Groups</h3>
      <CodeBlock lang="common resources" code={`# Core group (apiGroup: "")
pods, services, configmaps, secrets, persistentvolumeclaims,
serviceaccounts, namespaces, nodes, endpoints, events

# apps group (apiGroup: "apps")
deployments, replicasets, statefulsets, daemonsets

# batch group (apiGroup: "batch")
jobs, cronjobs

# RBAC group (apiGroup: "rbac.authorization.k8s.io")
roles, rolebindings, clusterroles, clusterrolebindings

# networking (apiGroup: "networking.k8s.io")
ingresses, networkpolicies`} />

      <h3 style={{ color: "#e6edf3", fontSize: "16px", marginTop: "20px" }}>RoleBinding vs ClusterRoleBinding</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ background: "#161b22" }}>
            {["Feature", "RoleBinding", "ClusterRoleBinding"].map(h => (
              <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#58a6ff", fontFamily: "monospace", borderBottom: "1px solid #30363d" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            ["Scope", "Single namespace", "Entire cluster"],
            ["Can bind a Role?", "✅ Yes (same namespace)", "❌ No"],
            ["Can bind a ClusterRole?", "✅ Yes (scoped to namespace)", "✅ Yes (cluster-wide)"],
            ["Non-namespaced resources", "❌ No", "✅ Yes (nodes, PVs...)"],
            ["Use case", "Namespace-level access", "Cluster-wide access"],
          ].map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #21262d" }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: "10px 14px", color: j === 0 ? "#c9d1d9" : j === 1 ? "#f0883e" : "#bc8cff", fontFamily: j > 0 ? "monospace" : "inherit" }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <InfoBox type="tip" title="Power Tip: ClusterRole + RoleBinding = Reusable Permissions">
        You can create a single ClusterRole (e.g., "pod-reader") and reuse it across many namespaces
        via namespace-scoped RoleBindings. This avoids duplicating Role definitions in every namespace.
      </InfoBox>

      <h3 style={{ color: "#e6edf3", fontSize: "16px", marginTop: "20px" }}>Built-in ClusterRoles</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        {[
          { name: "cluster-admin", desc: "Full control over all resources. God mode.", color: "#f85149" },
          { name: "admin", desc: "Full access within a namespace. Cannot modify namespace itself.", color: "#d29922" },
          { name: "edit", desc: "Read/write most resources in namespace. Cannot manage roles.", color: "#58a6ff" },
          { name: "view", desc: "Read-only access. Cannot see secrets.", color: "#3fb950" },
        ].map(r => (
          <div key={r.name} style={{ background: "#161b22", border: `1px solid ${r.color}44`, borderRadius: "6px", padding: "12px" }}>
            <code style={{ color: r.color, fontWeight: 700 }}>{r.name}</code>
            <p style={{ color: "#8b949e", margin: "4px 0 0 0", fontSize: "12px" }}>{r.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImplementSection() {
  const [method, setMethod] = useState("yaml");
  return (
    <div>
      <SectionHeader title="Implementation — All 4 Ways" subtitle="YAML manifest, kubectl imperative, kubectl dry-run, and patch" />

      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {[
          { id: "yaml", label: "📄 YAML Manifests" },
          { id: "imperative", label: "⚡ kubectl Imperative" },
          { id: "dryrun", label: "🧪 Dry Run & Verify" },
          { id: "patterns", label: "📐 Patterns" },
        ].map(m => (
          <button key={m.id} onClick={() => setMethod(m.id)} style={{
            background: method === m.id ? "#1f6feb" : "#161b22",
            border: `1px solid ${method === m.id ? "#388bfd" : "#30363d"}`,
            color: method === m.id ? "#ffffff" : "#8b949e",
            padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "13px",
          }}>{m.label}</button>
        ))}
      </div>

      {method === "yaml" && (
        <div>
          <h3 style={{ color: "#e6edf3", fontSize: "15px" }}>Step 1 — Create a Role</h3>
          <CodeBlock lang="simple-role.yaml" code={`apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: default
rules:
  - apiGroups: [""]          # "" = core API group
    resources: ["pods"]
    verbs: ["get", "watch", "list"]`} />

          <h3 style={{ color: "#e6edf3", fontSize: "15px", marginTop: "16px" }}>Step 2 — Create a RoleBinding</h3>
          <CodeBlock lang="simple-rolebinding.yaml" code={`apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: default         # Must be in the SAME namespace as the Role
subjects:
  - kind: User               # Binding a user
    name: alice              # Case-sensitive!
    apiGroup: rbac.authorization.k8s.io
  - kind: ServiceAccount     # Also binding a service account
    name: my-sa
    namespace: default       # SA namespace is required
  - kind: Group
    name: dev-team
    apiGroup: rbac.authorization.k8s.io
roleRef:                     # IMMUTABLE after creation
  kind: Role                 # Role or ClusterRole
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io`} />

          <h3 style={{ color: "#e6edf3", fontSize: "15px", marginTop: "16px" }}>ClusterRoleBinding Example</h3>
          <CodeBlock lang="cluster-rolebinding.yaml" code={`apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: read-pods-global
subjects:
  - kind: Group
    name: ops-team
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: view               # Built-in ClusterRole
  apiGroup: rbac.authorization.k8s.io`} />

          <h3 style={{ color: "#e6edf3", fontSize: "15px", marginTop: "16px" }}>RoleBinding using ClusterRole (Namespace-Scoped)</h3>
          <CodeBlock lang="rolebinding-clusterrole.yaml" code={`# Reuse a ClusterRole but limit it to one namespace
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: bob-admin-binding
  namespace: staging         # Access limited to 'staging' only
subjects:
  - kind: User
    name: bob
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole          # Referencing a ClusterRole!
  name: admin
  apiGroup: rbac.authorization.k8s.io`} />

          <CodeBlock lang="bash" code={`# Apply the manifests
kubectl apply -f simple-role.yaml
kubectl apply -f simple-rolebinding.yaml`} />
        </div>
      )}

      {method === "imperative" && (
        <div>
          <h3 style={{ color: "#e6edf3", fontSize: "15px" }}>Create Roles Imperatively</h3>
          <CodeBlock lang="bash" code={`# Create a Role
kubectl create role pod-reader \\
  --verb=get,list,watch \\
  --resource=pods \\
  --namespace=default

# Role with resourceNames (limit to specific resource instances)
kubectl create role secret-reader \\
  --verb=get \\
  --resource=secrets \\
  --resource-name=my-secret \\
  --namespace=production

# Role for multiple resources and verbs
kubectl create role app-manager \\
  --verb=get,list,watch,create,update,patch,delete \\
  --resource=pods,deployments,services \\
  --namespace=myapp`} />

          <h3 style={{ color: "#e6edf3", fontSize: "15px", marginTop: "16px" }}>Create RoleBindings Imperatively</h3>
          <CodeBlock lang="bash" code={`# Bind a Role to a User
kubectl create rolebinding read-pods \\
  --role=pod-reader \\
  --user=alice \\
  --namespace=default

# Bind a Role to a ServiceAccount
kubectl create rolebinding sa-binding \\
  --role=pod-reader \\
  --serviceaccount=default:my-sa \\
  --namespace=default

# Bind a Role to a Group
kubectl create rolebinding dev-binding \\
  --role=pod-reader \\
  --group=dev-team \\
  --namespace=default

# Bind a ClusterRole to a User in a specific namespace
kubectl create rolebinding bob-admin \\
  --clusterrole=admin \\
  --user=bob \\
  --namespace=staging

# Create a ClusterRoleBinding
kubectl create clusterrolebinding ops-view \\
  --clusterrole=view \\
  --group=ops-team`} />

          <h3 style={{ color: "#e6edf3", fontSize: "15px", marginTop: "16px" }}>Useful Management Commands</h3>
          <CodeBlock lang="bash" code={`# List all RoleBindings in a namespace
kubectl get rolebindings -n default

# List all ClusterRoleBindings
kubectl get clusterrolebindings

# Describe a RoleBinding (see full details)
kubectl describe rolebinding read-pods -n default

# Check what a user can do
kubectl auth can-i list pods --as=alice -n default        # → yes/no
kubectl auth can-i delete deployments --as=bob -n staging

# Check for a ServiceAccount
kubectl auth can-i list pods \\
  --as=system:serviceaccount:default:my-sa -n default

# List ALL permissions for a user (verbose)
kubectl auth can-i --list --as=alice -n default

# Delete a RoleBinding
kubectl delete rolebinding read-pods -n default`} />
        </div>
      )}

      {method === "dryrun" && (
        <div>
          <h3 style={{ color: "#e6edf3", fontSize: "15px" }}>Dry Run Before Applying</h3>
          <CodeBlock lang="bash" code={`# Generate YAML without applying (client-side dry-run)
kubectl create rolebinding my-binding \\
  --role=pod-reader \\
  --user=alice \\
  --namespace=default \\
  --dry-run=client -o yaml

# Server-side dry-run (validates against API server)
kubectl create rolebinding my-binding \\
  --role=pod-reader \\
  --user=alice \\
  --namespace=default \\
  --dry-run=server -o yaml

# Apply with dry-run first, then apply for real
kubectl apply -f rolebinding.yaml --dry-run=server
kubectl apply -f rolebinding.yaml`} />

          <h3 style={{ color: "#e6edf3", fontSize: "15px", marginTop: "16px" }}>Verify Access After Binding</h3>
          <CodeBlock lang="bash" code={`# Test permissions before and after binding
kubectl auth can-i list pods --as=alice -n default
# → no (before binding)

kubectl create rolebinding read-pods --role=pod-reader --user=alice -n default

kubectl auth can-i list pods --as=alice -n default
# → yes (after binding)

# Test escalation scenarios
kubectl auth can-i delete pods --as=alice -n default
# → no (role only has get/list/watch)

# Check what a ServiceAccount can do
kubectl auth can-i --list --as=system:serviceaccount:kube-system:default`} />

          <h3 style={{ color: "#e6edf3", fontSize: "15px", marginTop: "16px" }}>View and Debug RBAC</h3>
          <CodeBlock lang="bash" code={`# Who can do what? (requires kubectl-who-can plugin or auth can-i)
kubectl get rolebindings,clusterrolebindings -A \\
  -o custom-columns=\\
'KIND:.kind,NS:.metadata.namespace,NAME:.metadata.name,\\
ROLE:.roleRef.name,SUBJECTS:.subjects[*].name'

# See all RBAC resources at once
kubectl get roles,rolebindings,clusterroles,clusterrolebindings -A

# Get the roleRef of a binding (confirm it's correct)
kubectl get rolebinding read-pods -n default -o jsonpath='{.roleRef}'`} />
        </div>
      )}

      {method === "patterns" && (
        <div>
          <h3 style={{ color: "#e6edf3", fontSize: "15px" }}>Pattern 1: Aggregated ClusterRoles</h3>
          <CodeBlock lang="aggregated-clusterrole.yaml" code={`# Aggregation Rule: auto-combines roles with matching labels
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: monitoring-aggregate
aggregationRule:
  clusterRoleSelectors:
    - matchLabels:
        rbac.example.com/aggregate-to-monitoring: "true"
rules: []  # Rules populated automatically from matching ClusterRoles

---
# A ClusterRole that will be pulled in
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: pod-metrics-reader
  labels:
    rbac.example.com/aggregate-to-monitoring: "true"  # ← key label
rules:
  - apiGroups: ["metrics.k8s.io"]
    resources: ["pods"]
    verbs: ["get", "list"]`} />

          <h3 style={{ color: "#e6edf3", fontSize: "15px", marginTop: "16px" }}>Pattern 2: Cross-Namespace ServiceAccount Access</h3>
          <CodeBlock lang="cross-namespace.yaml" code={`# Allow ServiceAccount in namespace 'monitoring' to read pods in 'production'
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: allow-monitoring-sa
  namespace: production           # Access granted IN production namespace
subjects:
  - kind: ServiceAccount
    name: prometheus               # SA lives in monitoring namespace
    namespace: monitoring          # Namespace of the SA
roleRef:
  kind: ClusterRole
  name: view
  apiGroup: rbac.authorization.k8s.io`} />

          <h3 style={{ color: "#e6edf3", fontSize: "15px", marginTop: "16px" }}>Pattern 3: RBAC for Custom Resources (CRDs)</h3>
          <CodeBlock lang="crd-rbac.yaml" code={`apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: crd-operator
rules:
  - apiGroups: ["mycompany.io"]   # CRD group
    resources: ["myresources", "myresources/status"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
  - apiGroups: ["apiextensions.k8s.io"]
    resources: ["customresourcedefinitions"]
    verbs: ["get", "list"]`} />
        </div>
      )}
    </div>
  );
}

function AdvancedSection() {
  return (
    <div>
      <SectionHeader title="Advanced Topics" subtitle="Security best practices, escalation risks, and production patterns" />

      <h3 style={{ color: "#e6edf3", fontSize: "16px" }}>1. The Escalation Problem</h3>
      <InfoBox type="danger" title="Privilege Escalation Risk">
        A user CANNOT create a Role or ClusterRole with more permissions than they themselves have.
        They also cannot create a RoleBinding that grants permissions they don't possess — unless they have
        the <code>escalate</code> or <code>bind</code> verb on the relevant role resource.
      </InfoBox>

      <h3 style={{ color: "#e6edf3", fontSize: "16px", marginTop: "20px" }}>2. ResourceNames — Fine-Grained Control</h3>
      <CodeBlock lang="resourcenames-role.yaml" code={`# Restrict access to SPECIFIC named resources only
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: specific-secret-reader
  namespace: production
rules:
  - apiGroups: [""]
    resources: ["secrets"]
    resourceNames: ["app-db-password", "app-tls-cert"]  # Only THESE secrets
    verbs: ["get"]
# Note: 'list' and 'watch' cannot be restricted by resourceName
# because they return collections`} />

      <h3 style={{ color: "#e6edf3", fontSize: "16px", marginTop: "20px" }}>3. System Special Groups</h3>
      <div style={{ display: "grid", gap: "8px" }}>
        {[
          { name: "system:masters", desc: "Members bypass all authorization checks. Maps to cluster-admin. Never use in production workloads." },
          { name: "system:authenticated", desc: "All authenticated users. Useful for broad read-only access." },
          { name: "system:unauthenticated", desc: "Unauthenticated requests. Avoid granting any permissions here." },
          { name: "system:serviceaccounts", desc: "All ServiceAccounts in the cluster." },
          { name: "system:serviceaccounts:<namespace>", desc: "All ServiceAccounts in a specific namespace." },
        ].map(g => (
          <div key={g.name} style={{ background: "#161b22", borderRadius: "6px", padding: "12px", border: "1px solid #21262d" }}>
            <code style={{ color: "#79c0ff", fontSize: "13px" }}>{g.name}</code>
            <p style={{ color: "#8b949e", margin: "4px 0 0 0", fontSize: "12px" }}>{g.desc}</p>
          </div>
        ))}
      </div>

      <h3 style={{ color: "#e6edf3", fontSize: "16px", marginTop: "20px" }}>4. RBAC Best Practices</h3>
      <div style={{ display: "grid", gap: "8px" }}>
        {[
          { icon: "✅", text: "Use namespaced Roles + RoleBindings over ClusterRoles wherever possible." },
          { icon: "✅", text: "Create dedicated ServiceAccounts per workload; avoid using the 'default' SA." },
          { icon: "✅", text: "Prefer built-in ClusterRoles (view, edit, admin) and bind them with RoleBinding, not ClusterRoleBinding." },
          { icon: "✅", text: "Never grant 'secrets' list/watch unless absolutely necessary — it exposes all secrets." },
          { icon: "✅", text: "Regularly audit with kubectl auth can-i and tools like rbac-lookup, kubectl-who-can." },
          { icon: "✅", text: "Use resourceNames to limit access to specific instances for sensitive resources." },
          { icon: "❌", text: "Never use wildcards (*) in production Roles — it grants access to future resources too." },
          { icon: "❌", text: "Never bind system:masters to non-admin service accounts." },
          { icon: "❌", text: "Avoid granting escalate or bind verbs — they allow privilege escalation." },
        ].map((p, i) => (
          <div key={i} style={{ display: "flex", gap: "10px", padding: "10px 14px", background: "#161b22", borderRadius: "6px", border: "1px solid #21262d" }}>
            <span style={{ fontSize: "16px" }}>{p.icon}</span>
            <span style={{ color: "#c9d1d9", fontSize: "13px", lineHeight: "1.6" }}>{p.text}</span>
          </div>
        ))}
      </div>

      <h3 style={{ color: "#e6edf3", fontSize: "16px", marginTop: "20px" }}>5. Troubleshooting RBAC Denials</h3>
      <CodeBlock lang="bash" code={`# Error you'll see in pod logs or kubectl output:
# Error from server (Forbidden): pods is forbidden:
# User "alice" cannot list resource "pods" in API group ""
# in the namespace "default"

# Debug Steps:
# 1. Verify the binding exists
kubectl get rolebindings -n default | grep alice

# 2. Describe the binding
kubectl describe rolebinding read-pods -n default

# 3. Check the role's rules
kubectl describe role pod-reader -n default

# 4. Test directly
kubectl auth can-i list pods --as=alice -n default

# 5. Check if SA has an automounted token (for pods)
kubectl get serviceaccount my-sa -n default -o yaml

# 6. Enable RBAC audit logs in kube-apiserver:
# --audit-log-path=/var/log/audit.log
# --audit-policy-file=audit-policy.yaml`} />
    </div>
  );
}

const QA_DATA = [
  {
    q: "What is the difference between a Role and a ClusterRole?",
    a: "A Role is namespaced — it grants permissions within a single namespace. A ClusterRole is cluster-wide — it can grant permissions on non-namespaced resources (like nodes, PersistentVolumes) or across all namespaces. A ClusterRole can also be bound within a namespace via a RoleBinding."
  },
  {
    q: "Can a RoleBinding reference a ClusterRole?",
    a: "Yes! A RoleBinding can reference a ClusterRole, but the permissions are still scoped to the namespace of the RoleBinding. This is a key pattern for reusability — define the ClusterRole once, bind it per-namespace as needed."
  },
  {
    q: "Why is roleRef immutable in a RoleBinding?",
    a: "The Kubernetes API makes roleRef immutable to prevent unintended privilege escalation. If you could change the role being bound, an attacker with write access to RoleBindings could silently escalate privileges. To change the role, you must delete and recreate the binding."
  },
  {
    q: "What happens if a RoleBinding subject doesn't exist yet?",
    a: "Nothing bad — the binding is created successfully and no error occurs. Kubernetes doesn't validate that subjects (users, groups, SAs) exist at binding time. If the subject is later created and authenticates, the permissions take effect automatically."
  },
  {
    q: "How do you grant a ServiceAccount in namespace 'A' access to resources in namespace 'B'?",
    a: "Create a RoleBinding in namespace 'B' with the subject being the ServiceAccount from namespace 'A'. The SA is identified by kind: ServiceAccount, name: <sa-name>, namespace: A. The RoleBinding must be in namespace B."
  },
  {
    q: "Can you deny specific actions with RBAC?",
    a: "No. Kubernetes RBAC is purely additive (allow-only). There is no concept of deny rules. If any RoleBinding or ClusterRoleBinding grants an action, it is permitted. To restrict access, ensure no binding grants that permission."
  },
  {
    q: "What is the aggregationRule in a ClusterRole?",
    a: "aggregationRule lets you create a ClusterRole whose rules are automatically composed from other ClusterRoles that match specific label selectors. This is used by built-in roles like 'admin' and 'edit' so that CRD owners can extend them by just adding labels to their ClusterRoles."
  },
  {
    q: "What does kubectl auth can-i check exactly?",
    a: "It performs a SelfSubjectAccessReview (or SubjectAccessReview with --as) against the Kubernetes API to determine if a given subject can perform a specific verb on a resource. It respects all authorization modes including RBAC, webhooks, etc."
  },
];

function QASection() {
  const [open, setOpen] = useState(null);
  return (
    <div>
      <SectionHeader title="Logical Questions & Answers" subtitle="Conceptual and scenario-based questions to test deep understanding" />
      <div style={{ display: "grid", gap: "10px" }}>
        {QA_DATA.map((item, i) => (
          <div key={i} style={{ background: "#161b22", borderRadius: "8px", border: `1px solid ${open === i ? "#388bfd" : "#21262d"}`, overflow: "hidden" }}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              style={{
                width: "100%", textAlign: "left", background: "none", border: "none",
                padding: "14px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
              }}
            >
              <span style={{ color: "#e6edf3", fontSize: "14px", fontWeight: 500 }}>
                <span style={{ color: "#58a6ff", fontFamily: "monospace", marginRight: "10px" }}>Q{i + 1}.</span>
                {item.q}
              </span>
              <span style={{ color: "#8b949e", fontSize: "18px", flexShrink: 0 }}>{open === i ? "−" : "+"}</span>
            </button>
            {open === i && (
              <div style={{ padding: "0 16px 16px 16px", borderTop: "1px solid #21262d", paddingTop: "14px" }}>
                <p style={{ color: "#c9d1d9", fontSize: "14px", lineHeight: "1.8", margin: 0 }}>
                  <span style={{ color: "#3fb950", fontFamily: "monospace", fontWeight: 700, marginRight: "8px" }}>A:</span>
                  {item.a}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const EXERCISES = [
  {
    level: "Beginner", color: "#3fb950",
    title: "Ex 1: Grant Alice read-only pod access in 'dev' namespace",
    tasks: [
      "Create a namespace called 'dev'",
      "Create a Role 'pod-reader' in 'dev' with get, list, watch on pods",
      "Create a RoleBinding 'alice-pod-reader' binding the role to user 'alice'",
      "Verify with: kubectl auth can-i list pods --as=alice -n dev",
    ],
    solution: `kubectl create namespace dev
kubectl create role pod-reader \\
  --verb=get,list,watch --resource=pods -n dev
kubectl create rolebinding alice-pod-reader \\
  --role=pod-reader --user=alice -n dev
kubectl auth can-i list pods --as=alice -n dev`,
  },
  {
    level: "Beginner", color: "#3fb950",
    title: "Ex 2: Create a ServiceAccount with deployment access",
    tasks: [
      "Create SA 'deployer' in namespace 'staging'",
      "Create Role 'deployment-manager' with full access to deployments",
      "Bind the role to the SA",
      "Verify the SA cannot delete pods (not in the role)",
    ],
    solution: `kubectl create serviceaccount deployer -n staging
kubectl create role deployment-manager \\
  --verb=get,list,watch,create,update,patch,delete \\
  --resource=deployments -n staging
kubectl create rolebinding deployer-binding \\
  --role=deployment-manager \\
  --serviceaccount=staging:deployer -n staging
kubectl auth can-i delete pods \\
  --as=system:serviceaccount:staging:deployer -n staging`,
  },
  {
    level: "Intermediate", color: "#d29922",
    title: "Ex 3: Reuse ClusterRole across multiple namespaces",
    tasks: [
      "Create ClusterRole 'ns-reader' with get/list/watch on pods and services",
      "Bind it to user 'bob' in namespace 'team-a' only",
      "Bind it to user 'carol' in namespace 'team-b' only",
      "Verify bob cannot access team-b resources",
    ],
    solution: `kubectl create clusterrole ns-reader \\
  --verb=get,list,watch --resource=pods,services
kubectl create rolebinding bob-reader \\
  --clusterrole=ns-reader --user=bob -n team-a
kubectl create rolebinding carol-reader \\
  --clusterrole=ns-reader --user=carol -n team-b
kubectl auth can-i list pods --as=bob -n team-b
# → no`,
  },
  {
    level: "Intermediate", color: "#d29922",
    title: "Ex 4: Cross-namespace ServiceAccount access",
    tasks: [
      "Create namespace 'monitoring' and SA 'prometheus' in it",
      "Grant this SA read access to pods in ALL other namespaces",
      "Use ClusterRoleBinding with built-in 'view' ClusterRole",
    ],
    solution: `kubectl create namespace monitoring
kubectl create serviceaccount prometheus -n monitoring
kubectl create clusterrolebinding prometheus-view \\
  --clusterrole=view \\
  --serviceaccount=monitoring:prometheus`,
  },
  {
    level: "Advanced", color: "#f85149",
    title: "Ex 5: Least-privilege RBAC for a custom operator",
    tasks: [
      "Create a ClusterRole that allows managing a CRD 'myapps.example.io'",
      "Also allow reading ConfigMaps, Secrets (get only), and Events (create)",
      "Create a SA 'my-operator' in 'operators' namespace",
      "Bind with ClusterRoleBinding (operator needs cluster-wide CRD access)",
    ],
    solution: `kubectl create namespace operators
kubectl create serviceaccount my-operator -n operators
# Create the ClusterRole via YAML (imperative doesn't support custom apiGroups well):
cat <<EOF | kubectl apply -f -
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: my-operator-role
rules:
- apiGroups: ["example.io"]
  resources: ["myapps", "myapps/status"]
  verbs: ["get","list","watch","create","update","patch","delete"]
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get","list","watch"]
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get"]
- apiGroups: [""]
  resources: ["events"]
  verbs: ["create","patch"]
EOF
kubectl create clusterrolebinding my-operator-binding \\
  --clusterrole=my-operator-role \\
  --serviceaccount=operators:my-operator`,
  },
];

function ExercisesSection() {
  const [showSol, setShowSol] = useState({});
  return (
    <div>
      <SectionHeader title="Hands-on Exercises" subtitle="Practice from beginner to advanced — try before revealing solutions" />
      <div style={{ display: "grid", gap: "16px" }}>
        {EXERCISES.map((ex, i) => (
          <div key={i} style={{ background: "#161b22", borderRadius: "10px", border: `1px solid ${ex.color}44`, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", background: ex.color + "11", borderBottom: `1px solid ${ex.color}33`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, color: "#e6edf3", fontSize: "14px" }}>{ex.title}</h3>
              <Badge text={ex.level} color={ex.color} />
            </div>
            <div style={{ padding: "14px 16px" }}>
              <ol style={{ color: "#c9d1d9", fontSize: "13px", lineHeight: "2", paddingLeft: "20px", margin: "0 0 14px 0" }}>
                {ex.tasks.map((t, j) => <li key={j}>{t}</li>)}
              </ol>
              <button
                onClick={() => setShowSol({ ...showSol, [i]: !showSol[i] })}
                style={{
                  background: showSol[i] ? "#161b22" : ex.color + "22",
                  border: `1px solid ${ex.color}`,
                  color: ex.color, padding: "6px 14px", borderRadius: "6px",
                  cursor: "pointer", fontSize: "12px", fontFamily: "monospace",
                }}
              >
                {showSol[i] ? "▲ Hide Solution" : "▼ Reveal Solution"}
              </button>
              {showSol[i] && <CodeBlock lang="bash" code={ex.solution} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const MCQ_DATA = [
  {
    q: "Which Kubernetes object links a Role to a User?",
    options: ["Role", "ClusterRole", "RoleBinding", "ServiceAccount"],
    correct: 2,
    explain: "A RoleBinding grants the permissions defined in a Role to a set of subjects (users, groups, or service accounts).",
  },
  {
    q: "A RoleBinding can reference which of the following? (Choose best answer)",
    options: ["Only a Role in the same namespace", "Only a ClusterRole", "A Role in the same namespace OR a ClusterRole", "Any Role in any namespace"],
    correct: 2,
    explain: "A RoleBinding can reference a Role in the same namespace or a ClusterRole. When referencing a ClusterRole, permissions are still scoped to the RoleBinding's namespace.",
  },
  {
    q: "What happens to the roleRef field after a RoleBinding is created?",
    options: ["It can be updated with kubectl edit", "It is immutable and cannot be changed", "It auto-updates when the Role changes", "It can be patched with kubectl patch"],
    correct: 1,
    explain: "roleRef is immutable after creation. To change it, you must delete the RoleBinding and create a new one.",
  },
  {
    q: "Which built-in ClusterRole gives full cluster control?",
    options: ["admin", "edit", "cluster-admin", "superuser"],
    correct: 2,
    explain: "cluster-admin is the most powerful built-in ClusterRole. It grants full control over all resources in all namespaces.",
  },
  {
    q: "You want a ServiceAccount in the 'monitoring' namespace to read pods in the 'production' namespace. What is the correct approach?",
    options: [
      "Create a RoleBinding in 'monitoring' namespace",
      "Create a RoleBinding in 'production' namespace with the subject as the 'monitoring' SA",
      "Create a ClusterRoleBinding to the SA",
      "Both B and C are valid"
    ],
    correct: 3,
    explain: "Option B gives namespaced access (just 'production'). Option C gives cluster-wide access. Both are technically valid depending on the requirement. D is the most complete answer if you want to limit or allow both approaches.",
  },
  {
    q: "RBAC in Kubernetes follows which access model?",
    options: ["Allow-list only (additive)", "Deny-list only", "Both allow and deny rules", "Default-allow with explicit denies"],
    correct: 0,
    explain: "Kubernetes RBAC is purely additive. You can only grant permissions; you cannot explicitly deny them. All access is denied unless explicitly allowed.",
  },
  {
    q: "Which verb(s) are NOT restrictable by resourceNames?",
    options: ["get", "update", "list and watch", "delete"],
    correct: 2,
    explain: "list and watch return collections of resources, not individual named items. Therefore, resourceNames cannot be applied to them. Only instance-level verbs like get, update, patch, delete support resourceNames filtering.",
  },
  {
    q: "What does aggregationRule in a ClusterRole do?",
    options: [
      "Merges multiple RoleBindings together",
      "Automatically combines rules from ClusterRoles matching label selectors",
      "Allows a ClusterRole to be used in multiple namespaces",
      "Aggregates audit logs for RBAC events"
    ],
    correct: 1,
    explain: "aggregationRule makes a ClusterRole's rules dynamically populated by combining the rules of other ClusterRoles whose labels match the given selectors.",
  },
  {
    q: "Which group should you avoid granting permissions to in production?",
    options: ["system:authenticated", "system:serviceaccounts:default", "system:masters", "dev-team"],
    correct: 2,
    explain: "system:masters bypasses all authorization checks and is equivalent to cluster-admin. Members of this group have unrestricted access. It should never be used for regular workloads.",
  },
  {
    q: "A user with only 'edit' ClusterRole in a namespace tries to create a RoleBinding. What happens?",
    options: [
      "The RoleBinding is created successfully",
      "Denied — edit role does not include RBAC management permissions",
      "The RoleBinding is created but with limited scope",
      "It prompts for admin approval"
    ],
    correct: 1,
    explain: "The built-in 'edit' ClusterRole intentionally excludes permissions to manage Roles and RoleBindings. This prevents privilege escalation. You need the 'admin' ClusterRole or explicit RBAC permissions.",
  },
];

function MCQSection() {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const handleSelect = (qi, oi) => {
    if (submitted) return;
    setAnswers({ ...answers, [qi]: oi });
  };

  const handleSubmit = () => {
    let s = 0;
    MCQ_DATA.forEach((q, i) => { if (answers[i] === q.correct) s++; });
    setScore(s);
    setSubmitted(true);
  };

  const handleReset = () => { setAnswers({}); setSubmitted(false); setScore(0); };

  return (
    <div>
      <SectionHeader title="MCQ Quiz" subtitle={`${MCQ_DATA.length} questions — test your Kubernetes RBAC knowledge`} />

      {submitted && (
        <div style={{
          background: score >= 8 ? "#051a0f" : score >= 5 ? "#2d1f00" : "#2a0c0c",
          border: `2px solid ${score >= 8 ? "#3fb950" : score >= 5 ? "#d29922" : "#f85149"}`,
          borderRadius: "10px", padding: "20px", textAlign: "center", marginBottom: "24px",
        }}>
          <div style={{ fontSize: "36px", marginBottom: "8px" }}>{score >= 8 ? "🏆" : score >= 5 ? "👍" : "📚"}</div>
          <div style={{ fontSize: "22px", fontWeight: 700, color: "#e6edf3" }}>{score} / {MCQ_DATA.length}</div>
          <div style={{ color: "#8b949e", marginTop: "6px" }}>
            {score >= 8 ? "Excellent! You've mastered Kubernetes RBAC." : score >= 5 ? "Good effort! Review the explanations below." : "Keep studying — revisit the notes above."}
          </div>
          <button onClick={handleReset} style={{
            marginTop: "14px", background: "#1f6feb", border: "none", color: "#fff",
            padding: "8px 20px", borderRadius: "6px", cursor: "pointer",
          }}>Retry Quiz</button>
        </div>
      )}

      <div style={{ display: "grid", gap: "16px" }}>
        {MCQ_DATA.map((item, qi) => (
          <div key={qi} style={{ background: "#161b22", borderRadius: "8px", border: "1px solid #21262d", padding: "16px" }}>
            <p style={{ color: "#e6edf3", fontWeight: 600, fontSize: "14px", margin: "0 0 12px 0" }}>
              <span style={{ color: "#58a6ff", fontFamily: "monospace" }}>Q{qi + 1}. </span>{item.q}
            </p>
            <div style={{ display: "grid", gap: "8px" }}>
              {item.options.map((opt, oi) => {
                const isSelected = answers[qi] === oi;
                const isCorrect = oi === item.correct;
                let bg = "#0d1117", border = "#30363d", color = "#c9d1d9";
                if (submitted) {
                  if (isCorrect) { bg = "#051a0f"; border = "#3fb950"; color = "#3fb950"; }
                  else if (isSelected && !isCorrect) { bg = "#2a0c0c"; border = "#f85149"; color = "#f85149"; }
                } else if (isSelected) {
                  bg = "#051d4d"; border = "#388bfd"; color = "#79c0ff";
                }
                return (
                  <div key={oi} onClick={() => handleSelect(qi, oi)} style={{
                    background: bg, border: `1px solid ${border}`, borderRadius: "6px",
                    padding: "10px 14px", cursor: submitted ? "default" : "pointer",
                    color, fontSize: "13px", transition: "all 0.15s",
                    display: "flex", gap: "10px", alignItems: "center",
                  }}>
                    <span style={{ fontFamily: "monospace", opacity: 0.6 }}>
                      {String.fromCharCode(65 + oi)}.
                    </span>
                    {opt}
                    {submitted && isCorrect && <span style={{ marginLeft: "auto" }}>✅</span>}
                    {submitted && isSelected && !isCorrect && <span style={{ marginLeft: "auto" }}>❌</span>}
                  </div>
                );
              })}
            </div>
            {submitted && (
              <div style={{ marginTop: "12px", background: "#0d1117", borderRadius: "6px", padding: "10px 14px", borderLeft: "3px solid #58a6ff" }}>
                <span style={{ color: "#58a6ff", fontWeight: 700, fontSize: "12px", fontFamily: "monospace" }}>EXPLANATION: </span>
                <span style={{ color: "#8b949e", fontSize: "13px" }}>{item.explain}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {!submitted && (
        <button onClick={handleSubmit} disabled={Object.keys(answers).length < MCQ_DATA.length} style={{
          marginTop: "20px", width: "100%", padding: "14px",
          background: Object.keys(answers).length < MCQ_DATA.length ? "#21262d" : "#1f6feb",
          border: "none", borderRadius: "8px", color: "#fff",
          fontSize: "15px", fontWeight: 600, cursor: Object.keys(answers).length < MCQ_DATA.length ? "not-allowed" : "pointer",
        }}>
          {Object.keys(answers).length < MCQ_DATA.length
            ? `Answer all questions (${Object.keys(answers).length}/${MCQ_DATA.length})`
            : "Submit Quiz →"}
        </button>
      )}
    </div>
  );
}

// ─── MAIN APP ───────────────────────────────────────────────────────────────
export default function App() {
  const [active, setActive] = useState("intro");

  const renderSection = () => {
    switch (active) {
      case "intro": return <IntroSection />;
      case "why": return <WhySection />;
      case "concepts": return <ConceptsSection />;
      case "implement": return <ImplementSection />;
      case "advanced": return <AdvancedSection />;
      case "qa": return <QASection />;
      case "exercises": return <ExercisesSection />;
      case "mcq": return <MCQSection />;
      default: return null;
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#010409",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: "#e6edf3",
    }}>
      {/* Header */}
      <div style={{
        background: "#0d1117",
        borderBottom: "1px solid #21262d",
        padding: "20px 32px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <div style={{
          width: "36px", height: "36px",
          background: "linear-gradient(135deg, #326ce5, #58a6ff)",
          borderRadius: "8px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "18px", flexShrink: 0,
        }}>⎈</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "16px", color: "#e6edf3", fontFamily: "monospace" }}>
            Kubernetes RBAC — Role Bindings
          </div>
          <div style={{ color: "#8b949e", fontSize: "12px" }}>
            Comprehensive Lecture Notes · rbac.authorization.k8s.io/v1
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
          <Badge text="v1.35" color="#58a6ff" />
          <Badge text="GA" color="#3fb950" />
        </div>
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 77px)" }}>
        {/* Sidebar */}
        <div style={{
          width: "220px", flexShrink: 0,
          background: "#0d1117",
          borderRight: "1px solid #21262d",
          padding: "16px 12px",
          position: "sticky",
          top: "77px",
          height: "calc(100vh - 77px)",
          overflowY: "auto",
        }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActive(s.id)} style={{
              display: "block", width: "100%", textAlign: "left",
              padding: "9px 12px", marginBottom: "2px",
              background: active === s.id ? "#1f6feb22" : "none",
              border: active === s.id ? "1px solid #1f6feb" : "1px solid transparent",
              borderRadius: "6px",
              color: active === s.id ? "#58a6ff" : "#8b949e",
              cursor: "pointer",
              fontSize: "13px",
              transition: "all 0.15s",
            }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: "32px", maxWidth: "900px", overflowX: "hidden" }}>
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
