import { site } from "@/data/site";

/**
 * The staff passcode, checked on the server. STAFF_PASSCODE, if set, is never
 * sent to the browser; otherwise the public one from the site settings is
 * used, which is what the panel itself compares against.
 */
export const staffCode = () => process.env.STAFF_PASSCODE || site.staff.passcode;
export const authorised = (req: Request) => req.headers.get("x-staff-code") === staffCode();
export const unauthorised = () => Response.json({ error: "Incorrect passcode" }, { status: 401 });
