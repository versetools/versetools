<script lang="ts">
	import Icon from "./icon.svelte";
	import type { IconProps } from "./icon.svelte";

	let props: Omit<IconProps, "svg"> = $props();
</script>

<Icon
	{...props}
	svg={`<svg width="23" height="24" viewBox="0 0 23 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<mask id="mask0_39_3" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="23" height="24">
<path d="M22.7791 9.7736H11.745V14.3872H18.0853C17.9833 15.0402 17.7545 15.6825 17.4194 16.2681C17.0353 16.9392 16.5607 17.4501 16.0741 17.8391C14.6165 19.0045 12.9174 19.2428 11.7373 19.2428C8.75619 19.2428 6.20914 17.2323 5.22302 14.5005C5.18325 14.4013 5.15688 14.2989 5.12467 14.1977C4.90162 13.4889 4.78787 12.7472 4.78772 12.0006C4.78772 11.2041 4.91663 10.4417 5.1517 9.72154C6.07891 6.88134 8.68347 4.76006 11.7394 4.76006C12.3541 4.76006 12.946 4.83638 13.5073 4.98867C14.533 5.26626 15.4768 5.80775 16.2536 6.56431L19.6087 3.13573C17.5678 1.18315 14.9074 0 11.7339 0C9.19683 0 6.85453 0.824769 4.93504 2.21884C3.37846 3.34924 2.10181 4.86288 1.24017 6.62069C0.438832 8.25063 0 10.0569 0 11.9989C0 13.941 0.439571 15.766 1.24091 17.3808V17.3917C2.08735 19.1061 3.32522 20.5822 4.82962 21.7075C6.14398 22.6905 8.50066 23.9998 11.7339 23.9998C13.5932 23.9998 15.2411 23.6501 16.6944 22.9945C17.7428 22.5216 18.6717 21.9048 19.5127 21.112C20.624 20.0646 21.4942 18.769 22.0883 17.2784C22.6823 15.7878 23 14.1021 23 12.2746C23 11.4235 22.918 10.5591 22.7791 9.7736Z" fill="white"/>
</mask>
<g mask="url(#mask0_39_3)">
<g filter="url(#filter0_f_39_3)">
<path d="M-0.168945 12.0803C-0.156785 13.9918 0.365196 15.964 1.15528 17.5561V17.5671C1.72623 18.7233 2.50645 19.6365 3.39504 20.5415L8.7625 18.4979C7.74696 17.9596 7.592 17.6298 6.86412 17.028C6.12022 16.2453 5.56578 15.3468 5.22053 14.2931H5.20657L5.22053 14.2822C4.99335 13.5865 4.97101 12.8479 4.96254 12.0803H-0.168945Z" fill="url(#paint0_radial_39_3)"/>
</g>
<g filter="url(#filter1_f_39_3)">
<path d="M11.7451 -0.0871582C11.2147 1.85765 11.4174 3.74798 11.7451 4.8479C12.3578 4.84842 12.948 4.92457 13.5075 5.07643C14.5332 5.35401 15.4769 5.89551 16.2537 6.65207L19.6947 3.13594C17.6562 1.18561 15.2031 -0.0841364 11.7451 -0.0871582Z" fill="url(#paint1_radial_39_3)"/>
</g>
<g filter="url(#filter2_f_39_3)">
<path d="M11.7336 -0.102539C9.13151 -0.102539 6.72907 0.743382 4.76036 2.1732C4.03166 2.70219 3.36115 3.31461 2.76117 3.9992C2.60473 5.53115 3.93257 7.41388 6.56219 7.39826C7.83802 5.84973 9.72506 4.84772 11.8252 4.84772L11.831 4.84789L11.7452 -0.102194C11.7413 -0.102194 11.7376 -0.102539 11.7337 -0.102539H11.7336Z" fill="url(#paint2_radial_39_3)"/>
</g>
<g filter="url(#filter3_f_39_3)">
<path d="M20.3223 12.6348L17.9997 14.2998C17.8978 14.9526 17.6687 15.595 17.3336 16.1807C16.9496 16.8517 16.475 17.3626 15.9883 17.7517C14.5339 18.9146 12.8392 19.1541 11.6594 19.155C10.44 21.3223 10.2262 22.4078 11.7451 24.1568C13.6248 24.1555 15.291 23.8014 16.7608 23.1384C17.8233 22.6592 18.7646 22.034 19.6169 21.2307C20.743 20.1691 21.6251 18.8561 22.2271 17.3455C22.8291 15.8349 23.1511 14.1267 23.1511 12.2747L20.3223 12.6348Z" fill="url(#paint3_radial_39_3)"/>
</g>
<g filter="url(#filter4_f_39_3)">
<path d="M11.5737 9.59839V14.5625H22.7484C22.8467 13.8827 23.1717 13.003 23.1717 12.2746C23.1717 11.4235 23.0899 10.384 22.9509 9.59839H11.5737Z" fill="#3086FF"/>
</g>
<g filter="url(#filter5_f_39_3)">
<path d="M2.81466 3.82397C2.12499 4.61127 1.53588 5.49251 1.06878 6.44548C0.267446 8.07542 -0.171387 10.0569 -0.171387 11.999C-0.171387 12.0263 -0.169251 12.0531 -0.169004 12.0805C0.18594 12.7905 4.73333 12.6545 4.96257 12.0805C4.96224 12.0537 4.95936 12.0275 4.95936 12.0007C4.95936 11.2042 5.08836 10.6171 5.32334 9.89694C5.61338 9.00863 6.06741 8.19068 6.64806 7.48592C6.77968 7.31057 7.13076 6.93363 7.23314 6.70751C7.27217 6.62144 7.16231 6.57309 7.15615 6.54279C7.14933 6.50886 7.00201 6.53614 6.96907 6.51084C6.86431 6.43063 6.65685 6.38876 6.53081 6.35155C6.26156 6.27204 5.81533 6.0966 5.56745 5.91469C4.78394 5.33986 3.56136 4.65315 2.81466 3.82397Z" fill="url(#paint4_radial_39_3)"/>
</g>
<g filter="url(#filter6_f_39_3)">
<path d="M5.58435 6.5461C7.40114 7.69445 7.92361 5.96644 9.13157 5.42571L7.03034 0.878906C6.26376 1.21513 5.53282 1.63483 4.84949 2.13113C3.83757 2.86602 2.94396 3.76288 2.20581 4.78337L5.58435 6.5461Z" fill="url(#paint5_radial_39_3)"/>
</g>
<g filter="url(#filter7_f_39_3)">
<path d="M6.32369 18.1467C3.88484 19.0654 3.50303 19.0984 3.27856 20.6755C3.70886 21.1138 4.17007 21.5174 4.65824 21.8828C5.97252 22.8658 8.50068 24.1751 11.734 24.1751C11.7377 24.1751 11.7413 24.1747 11.7452 24.1747V19.0674L11.7375 19.0675C10.5267 19.0675 9.55918 18.7357 8.56723 18.1587C8.32263 18.0164 7.87887 18.3984 7.65333 18.2277C7.34226 17.992 6.59343 18.4305 6.32369 18.1467Z" fill="url(#paint6_radial_39_3)"/>
</g>
<g opacity="0.5" filter="url(#filter8_f_39_3)">
<path d="M10.3169 18.9065V24.0863C10.7693 24.1416 11.2401 24.1751 11.734 24.1751C12.2291 24.1751 12.708 24.1486 13.1735 24.0998V18.9414C12.699 19.0254 12.2187 19.0676 11.7375 19.0675C11.2501 19.0675 10.7762 19.0083 10.3169 18.9065Z" fill="url(#paint7_linear_39_3)"/>
</g>
</g>
<defs>
<filter id="filter0_f_39_3" x="-0.639146" y="11.6101" width="9.8718" height="9.40158" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="0.2351" result="effect1_foregroundBlur_39_3"/>
</filter>
<filter id="filter1_f_39_3" x="10.9487" y="-0.557359" width="9.21628" height="7.67966" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="0.2351" result="effect1_foregroundBlur_39_3"/>
</filter>
<filter id="filter2_f_39_3" x="2.27858" y="-0.57274" width="10.0227" height="8.44138" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="0.2351" result="effect1_foregroundBlur_39_3"/>
</filter>
<filter id="filter3_f_39_3" x="10.2046" y="11.8045" width="13.4167" height="12.8225" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="0.2351" result="effect1_foregroundBlur_39_3"/>
</filter>
<filter id="filter4_f_39_3" x="11.1035" y="9.12819" width="12.5383" height="5.90451" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="0.2351" result="effect1_foregroundBlur_39_3"/>
</filter>
<filter id="filter5_f_39_3" x="-0.641587" y="3.35377" width="8.35324" height="9.67966" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="0.2351" result="effect1_foregroundBlur_39_3"/>
</filter>
<filter id="filter6_f_39_3" x="-1.09919" y="-2.4261" width="13.5358" height="12.6632" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="1.6525" result="effect1_foregroundBlur_39_3"/>
</filter>
<filter id="filter7_f_39_3" x="2.80836" y="17.656" width="9.40695" height="6.98923" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="0.2351" result="effect1_foregroundBlur_39_3"/>
</filter>
<filter id="filter8_f_39_3" x="9.84669" y="18.4363" width="3.79685" height="6.20896" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="0.2351" result="effect1_foregroundBlur_39_3"/>
</filter>
<radialGradient id="paint0_radial_39_3" cx="0" cy="0" r="1" gradientTransform="matrix(-0.477929 -11.9518 17.184 -0.717214 8.65502 20.3613)" gradientUnits="userSpaceOnUse">
<stop offset="0.142" stop-color="#1ABD4D"/>
<stop offset="0.248" stop-color="#6EC30D"/>
<stop offset="0.312" stop-color="#8AC502"/>
<stop offset="0.366" stop-color="#A2C600"/>
<stop offset="0.446" stop-color="#C8C903"/>
<stop offset="0.54" stop-color="#EBCB03"/>
<stop offset="0.616" stop-color="#F7CD07"/>
<stop offset="0.699" stop-color="#FDCD04"/>
<stop offset="0.771" stop-color="#FDCE05"/>
<stop offset="0.861" stop-color="#FFCE0A"/>
</radialGradient>
<radialGradient id="paint1_radial_39_3" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(19.3728 6.39773) scale(8.11667 10.7091)">
<stop offset="0.408" stop-color="#FB4E5A"/>
<stop offset="1" stop-color="#FF4540"/>
</radialGradient>
<radialGradient id="paint2_radial_39_3" cx="0" cy="0" r="1" gradientTransform="matrix(-11.3721 6.43487 8.54712 15.7659 14.9401 -1.65275)" gradientUnits="userSpaceOnUse">
<stop offset="0.231" stop-color="#FF4541"/>
<stop offset="0.312" stop-color="#FF4540"/>
<stop offset="0.458" stop-color="#FF4640"/>
<stop offset="0.54" stop-color="#FF473F"/>
<stop offset="0.699" stop-color="#FF5138"/>
<stop offset="0.771" stop-color="#FF5B33"/>
<stop offset="0.861" stop-color="#FF6C29"/>
<stop offset="1" stop-color="#FF8C18"/>
</radialGradient>
<radialGradient id="paint3_radial_39_3" cx="0" cy="0" r="1" gradientTransform="matrix(-20.6238 -27.5045 -9.93758 7.7775 11.914 22.6035)" gradientUnits="userSpaceOnUse">
<stop offset="0.132" stop-color="#0CBA65"/>
<stop offset="0.21" stop-color="#0BB86D"/>
<stop offset="0.297" stop-color="#09B479"/>
<stop offset="0.396" stop-color="#08AD93"/>
<stop offset="0.477" stop-color="#0AA6A9"/>
<stop offset="0.568" stop-color="#0D9CC6"/>
<stop offset="0.667" stop-color="#1893DD"/>
<stop offset="0.769" stop-color="#258BF1"/>
<stop offset="0.859" stop-color="#3086FF"/>
</radialGradient>
<radialGradient id="paint4_radial_39_3" cx="0" cy="0" r="1" gradientTransform="matrix(-1.4595 12.8521 17.3939 2.06169 10.7374 2.16413)" gradientUnits="userSpaceOnUse">
<stop offset="0.366" stop-color="#FF4E3A"/>
<stop offset="0.458" stop-color="#FF8A1B"/>
<stop offset="0.54" stop-color="#FFA312"/>
<stop offset="0.616" stop-color="#FFB60C"/>
<stop offset="0.771" stop-color="#FFCD0A"/>
<stop offset="0.861" stop-color="#FECF0A"/>
<stop offset="0.915" stop-color="#FECF08"/>
<stop offset="1" stop-color="#FDCD01"/>
</radialGradient>
<radialGradient id="paint5_radial_39_3" cx="0" cy="0" r="1" gradientTransform="matrix(-4.21863 4.76668 -13.1599 -12.1564 8.6852 2.03062)" gradientUnits="userSpaceOnUse">
<stop offset="0.316" stop-color="#FF4C3C"/>
<stop offset="0.604" stop-color="#FF692C"/>
<stop offset="0.727" stop-color="#FF7825"/>
<stop offset="0.885" stop-color="#FF8D1B"/>
<stop offset="1" stop-color="#FF9F13"/>
</radialGradient>
<radialGradient id="paint6_radial_39_3" cx="0" cy="0" r="1" gradientTransform="matrix(-11.3721 -6.43487 8.54712 -15.7659 14.9401 25.6523)" gradientUnits="userSpaceOnUse">
<stop offset="0.231" stop-color="#0FBC5F"/>
<stop offset="0.312" stop-color="#0FBC5F"/>
<stop offset="0.366" stop-color="#0FBC5E"/>
<stop offset="0.458" stop-color="#0FBC5D"/>
<stop offset="0.54" stop-color="#12BC58"/>
<stop offset="0.699" stop-color="#28BF3C"/>
<stop offset="0.771" stop-color="#38C02B"/>
<stop offset="0.861" stop-color="#52C218"/>
<stop offset="0.915" stop-color="#67C30F"/>
<stop offset="1" stop-color="#86C504"/>
</radialGradient>
<linearGradient id="paint7_linear_39_3" x1="10.3169" y1="21.5408" x2="13.1735" y2="21.5408" gradientUnits="userSpaceOnUse">
<stop stop-color="#0FBC5C"/>
<stop offset="1" stop-color="#0CBA65"/>
</linearGradient>
</defs>
</svg>`}
/>
