import math
import typing
from pyquaternion import Quaternion


def quaternion_to_dict(quat: Quaternion) -> typing.Dict[str, float]:
    """Returns a diction representation of a :class:`Quaternion`"""
    return {"x": quat.x, "y": quat.y, "z": quat.z, "w": quat.w}


class Vector3D(dict):
    """Convenience dictionary that inits with 'x,y,z' and has properties to access x,y,z"""

    def __init__(self, x=0, y=0, z=0):
        super().__init__(x=float(x), y=float(y), z=float(z))

    def __setitem__(self, key, value):
        if key in ["x", "y", "z"]:
            return dict.__setitem__(self, key, float(value))
        return dict.__setitem__(self, key, value)

    def __iter__(self):
        yield self.x
        yield self.y
        yield self.z

    def __iadd__(self, other):
        if isinstance(other, Vector3D):
            self.x += other.x
            self.y += other.y
            self.z += other.z
        else:
            self.x += other
            self.y += other
            self.z += other
        return self

    def __add__(self, other):
        if isinstance(other, Vector3D):
            return Vector3D(self.x + other.x, self.y + other.y, self.z + other.z)
        return Vector3D(self.x + other, self.y + other, self.z + other)

    def __isub__(self, other):
        if isinstance(other, Vector3D):
            self.x -= other.x
            self.y -= other.y
            self.z -= other.z
        else:
            self.x -= other
            self.y -= other
            self.z -= other
        return self

    def __sub__(self, other):
        if isinstance(other, Vector3D):
            return Vector3D(self.x - other.x, self.y - other.y, self.z - other.z)
        return Vector3D(self.x - other, self.y - other, self.z - other)

    def __imul__(self, other):
        if isinstance(other, Vector3D):
            self.x *= other.x
            self.y *= other.y
            self.z *= other.z
        else:
            self.x *= other
            self.y *= other
            self.z *= other
        return self

    def __mul__(self, other):
        if isinstance(other, Vector3D):
            return Vector3D(self.x * other.x, self.y * other.y, self.z * other.z)
        return Vector3D(self.x * other, self.y * other, self.z * other)

    def __abs__(self):
        return Vector3D(abs(self.x), abs(self.y), abs(self.z))

    def __truediv__(self, other):
        if isinstance(other, Vector3D):
            return Vector3D(self.x / other.x, self.y / other.y, self.z / other.z)
        return Vector3D(self.x / other, self.y / other, self.z / other)

    def __itruediv__(self, other):
        if isinstance(other, Vector3D):
            self.x /= other.x
            self.y /= other.y
            self.z /= other.z
        else:
            self.x /= other
            self.y /= other
            self.z /= other
        return self

    def cross(self, other: "Vector3D"):
        """Return the cross product of this vector with the `other` vector"""
        return Vector3D(
            self.y * other.z - self.z * other.y,
            self.z * other.x - self.x * other.z,
            self.x * other.y - self.y * other.x,
        )

    @property
    def x(self):
        return self["x"]

    @x.setter
    def x(self, value):
        self["x"] = value

    @property
    def y(self):
        return self["y"]

    @y.setter
    def y(self, value):
        self["y"] = value

    @property
    def z(self):
        return self["z"]

    @z.setter
    def z(self, value):
        self["z"] = value


def vector_from_csv(values: str, order="xyz") -> Vector3D:
    """
    Create a `Vector3D` from a comma-separated value of 3 floats. Floats are interpreted as the corresponding position
    in `order`.

    :param values: `str` of csv float values
    :param order: Definition of which column corresponds to which attribute of the Vector
    :return: `Vector3D`
    """
    v = {order[i]: float(_.strip()) for i, _ in enumerate(values.split(","))}
    return Vector3D(**v)


def quaternion_from_csv(values: str, order="wxyz") -> Quaternion:
    """
    Create a `Quaternion` from a comma-separated value of 4 floats. Floats are interpreted as the corresponding position
    in `order`.

    :param values: `str` of csv float values
    :param order: Definition of which column corresponds to which attribute of the Quaternion
    :return: `Quaternion`
    """
    q = {order[i]: float(_.strip()) for i, _ in enumerate(values.split(","))}
    return Quaternion(**q)


def vec3_to_tuple(vec3):
    vec3 = vec3.properties
    return vec3["x"], vec3["y"], vec3["z"]


def euler_to_quaternion(roll, pitch, yaw):
    qx = math.sin(roll / 2) * math.cos(pitch / 2) * math.cos(yaw / 2) - math.cos(
        roll / 2
    ) * math.sin(pitch / 2) * math.sin(yaw / 2)
    qy = math.cos(roll / 2) * math.sin(pitch / 2) * math.cos(yaw / 2) + math.sin(
        roll / 2
    ) * math.cos(pitch / 2) * math.sin(yaw / 2)
    qz = math.cos(roll / 2) * math.cos(pitch / 2) * math.sin(yaw / 2) - math.sin(
        roll / 2
    ) * math.sin(pitch / 2) * math.cos(yaw / 2)
    qw = math.cos(roll / 2) * math.cos(pitch / 2) * math.cos(yaw / 2) + math.sin(
        roll / 2
    ) * math.sin(pitch / 2) * math.sin(yaw / 2)

    return [qw, qx, qy, qz]


def ang3_to_quaternion(ang3):
    ang3 = ang3.properties
    return Quaternion(*euler_to_quaternion(ang3["x"], ang3["y"], ang3["z"]))
