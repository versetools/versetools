<div
	class="nav-top-fade from-background sticky top-0 left-0 z-1 h-6 w-full bg-linear-to-b to-transparent"
></div>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.nav-top-fade {
		visibility: hidden;
	}

	@supports (animation-timeline: scroll()) {
		.nav-top-fade {
			--fade-visibility: var(--can-scroll, hidden);

			visibility: var(--fade-visibility, visible);
			animation: fade-in linear both;
			animation-timeline: --nav-scroll;
			animation-range: 0 12px;
		}
	}
</style>
