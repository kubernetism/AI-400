GROUP:      rbac.authorization.k8s.io
KIND:       RoleBinding
VERSION:    v1

DESCRIPTION:
    RoleBinding references a role, but does not contain it.  It can reference a
    Role in the same namespace or a ClusterRole in the global namespace. It adds
    who information via Subjects and namespace information by which namespace it
    exists in.  RoleBindings in a given namespace only have effect in that
    namespace.
    
FIELDS:
  apiVersion	<string>
    APIVersion defines the versioned schema of this representation of an object.
    Servers should convert recognized schemas to the latest internal value, and
    may reject unrecognized values. More info:
    https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources

  kind	<string>
    Kind is a string value representing the REST resource this object
    represents. Servers may infer this from the endpoint the client submits
    requests to. Cannot be updated. In CamelCase. More info:
    https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds

  metadata	<ObjectMeta>
    Standard object's metadata.

  roleRef	<RoleRef> -required-
    RoleRef can reference a Role in the current namespace or a ClusterRole in
    the global namespace. If the RoleRef cannot be resolved, the Authorizer must
    return an error. This field is immutable.

  subjects	<[]Subject>
    Subjects holds references to the objects the role applies to.


