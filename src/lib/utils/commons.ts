export function isEmptyObject(object: Object) {
	if (typeof object !== 'object' || object == null) return false;
	for (const _ in object) {
		return false;
	}
	return true;
}
