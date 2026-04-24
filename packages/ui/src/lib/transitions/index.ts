import { type TransitionConfig } from "svelte/transition";

export * from "./flyAndScale";

export type Transition<TParams, TElement extends Element = any> = (
	node: TElement,
	params?: TParams
) => TransitionConfig;

export type TransitionProps<T extends Transition<any>> = {
	transition?: T;
	transitionParams?: T extends Transition<infer TParams> ? TParams : never;
};

export type TransitionInProps<T extends Transition<any>> = {
	transitionIn?: T;
	transitionInParams?: T extends Transition<infer TParams> ? TParams : never;
};

export type TransitionOutProps<T extends Transition<any>> = {
	transitionOut?: T;
	transitionOutParams?: T extends Transition<infer TParams> ? TParams : never;
};

export type TransitionsProps<
	InOutTransition extends Transition<any>,
	InTransition extends Transition<any>,
	OutTransition extends Transition<any>
> = TransitionProps<InOutTransition> &
	TransitionInProps<InTransition> &
	TransitionOutProps<OutTransition>;

export const noop: Transition<any> = () => ({ duration: 0 });
