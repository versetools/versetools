<div
	class="nav-top-fade from-background z-1 bg-linear-to-b sticky left-0 top-0 h-6 w-full to-transparent"
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
