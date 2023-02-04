export const batchRequestedItems = (array: Array<any>, size: number) => {
	const copy = array.slice();
	const batches = [];
	do {
		batches.push(copy.splice(0, size));
	} while (copy.length > 0);

	return batches;
};
