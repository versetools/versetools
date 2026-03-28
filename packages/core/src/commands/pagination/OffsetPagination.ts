import type { GenericId } from "convex/values";

export class OffsetPagination<T extends { _id: GenericId<any> }, TResult = T> {
	constructor(
		readonly documents: T[],
		private readonly getPage: (pageDocuments: T[]) => TResult[] | Promise<TResult[]> = (docs) =>
			docs as unknown as TResult[]
	) {}

	public async at(cursor: T["_id"] | null, take: number) {
		const startIndex = this.stepCursorIndex(take, cursor);
		return await this.take(startIndex, take);
	}

	public async start(take: number) {
		return await this.take(0, take);
	}

	public async end(take: number) {
		const endIndex = this.stepIndex(take, -1);
		return await this.take(endIndex, take);
	}

	private async take(startIndex: number, take: number) {
		const endIndex = startIndex + take;
		const page = Math.floor(startIndex / take);

		const isDone = endIndex >= this.documents.length;
		const continueCursor = isDone ? null : this.documents[endIndex]._id;

		const previousIndex = page === 0 ? null : this.stepIndex(take, page - 1);
		const previousCursor =
			previousIndex !== null ? (this.documents[previousIndex]?._id ?? null) : null;

		const slice = this.documents.slice(startIndex, endIndex);
		const results = await this.getPage(slice);

		return {
			results,
			page,
			total: this.documents.length,
			previousCursor,
			continueCursor,
			isDone
		};
	}

	private stepCursorIndex(take: number, cursor: T["_id"] | null) {
		if (!cursor) {
			return 0;
		}

		const cursorIndex = this.documents.findIndex((doc) => doc._id === cursor) ?? 0;
		return Math.floor(cursorIndex / take) * take;
	}

	private stepIndex(take: number, page: number) {
		const totalPages = Math.ceil(this.documents.length / take);
		page = page < 0 ? totalPages + page : page;

		const index = (page % totalPages) * take;
		return index;
	}
}
