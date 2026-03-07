GROUP:      rbac.authorization.k8s.io
KIND:       RoleBinding
VERSION:    v1

FIELD: subjects <[]Subject>


DESCRIPTION:
    Subjects holds references to the objects the role applies to.
    Subject contains a reference to the object or user identities a role binding
    applies to.  This can either hold a direct API object reference, or a value
    for non-objects such as user and group names.
    
FIELDS:
  apiGroup	<string>
    APIGroup holds the API group of the referenced subject. Defaults to "" for
    ServiceAccount subjects. Defaults to "rbac.authorization.k8s.io" for User
    and Group subjects.

  kind	<string> -required-
    Kind of object being referenced. Values defined by this API group are
    "User", "Group", and "ServiceAccount". If the Authorizer does not recognized
    the kind value, the Authorizer should report an error.

  name	<string> -required-
    Name of the object being referenced.

  namespace	<string>
    Namespace of the referenced object.  If the object kind is non-namespace,
    such as "User" or "Group", and this value is not empty the Authorizer should
    report an error.


