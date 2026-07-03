export type HttpRequestContract = RequestInit & {
	path: string;
};

export interface HttpRequestInterface {
	readonly name: string;
	readonly decodedType: any;

	buildRequest(): HttpRequestContract;
}
