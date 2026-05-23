import { docsDomain } from "./base.js";

const baseURL = `https://${docsDomain}/policies`;

export const policies = {
	terms: `${baseURL}/terms`,
	privacy: `${baseURL}/privacy`,
	cookies: `${baseURL}/privacy/cookies`,
	subprocessors: `${baseURL}/privacy/subprocessors`,
	security: `${baseURL}/security`,
	securityResponse: `${baseURL}/security/response`,
	abuse: `${baseURL}/abuse`,
	copyright: `${baseURL}/copyright`
};
