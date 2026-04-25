import { docsDomain } from "./base";

const baseURL = `https://${docsDomain}/policies`;

export const policies = {
	terms: `${baseURL}/terms`,
	privacy: `${baseURL}/privacy`,
	cookies: `${baseURL}/privacy/cookies`,
	processors: `${baseURL}/privacy/processors`,
	abuse: `${baseURL}/abuse`,
	copyright: `${baseURL}/copyright`
};
