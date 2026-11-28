declare const validationMessage: unique symbol;

export interface ValidationFailure<Reason extends string> {
	[validationMessage]: Reason;
}

type ValidationMessage<Validation extends readonly unknown[]> =
	Validation[number] extends infer Failure
		? Failure extends ValidationFailure<infer Reason>
			? Reason
			: never
		: never;

export type Invalid<Validation extends readonly unknown[]> = [
	ValidationMessage<Validation>
] extends [never]
	? unknown
	: {
			error: ValidationMessage<Validation>;
		};

/**
 * Skips `Validation` when `Output` is `any`.
 * Otherwise the error each method requires would differ, and no concrete instance would be assignable to them.
 */
export type ValidateConcrete<Output, Validation extends readonly unknown[]> = 0 extends 1 & Output
	? []
	: Validation;
