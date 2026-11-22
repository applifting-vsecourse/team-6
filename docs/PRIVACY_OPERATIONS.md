# Privacy operations

Short, practical notes for running the pilot. The reasoning is in [`GDPR_AUDIT.md`](GDPR_AUDIT.md); the design is in [`ARCHITECTURE.md`](ARCHITECTURE.md). Not legal advice: counsel confirms.

## Who does what

The **controller is not decided yet.** Until it is, the privacy page says so (`PrivacyPage.tsx`, key `privacy.controller.text`). Name the controller and an owner for each task below before the pilot launches.

## Requests from people (one month to answer)

The clock starts when the request arrives; it can be extended by two months if the request is complex, but the person must be told within the first month. Answer from the account's own e-mail or from the signed-in app; never ask for an ID document. Keep a line per request: received, due, what was done.

| Request                       | How                                                                                                                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Access, portability           | The person downloads it on their profile page (`GET /me/export`). If they write instead, send the same file.                                                                                |
| Rectification                 | Profile answers: the person edits them. Name, username, e-mail: an admin changes them in the database, by user id, after the request.                                                       |
| Erasure                       | The person deletes the account on the profile page (`DELETE /me`). Messages stay in the kvintet without a name; matching-log rows lose the user id.                                         |
| Objection to the matching log | Delete that user's `feed_snapshot` and `membership_log` rows by user id. Tell them the log starts again the next time they load the feed, so for a lasting objection the account has to go. |
| Anything else                 | Answer within the month, in writing.                                                                                                                                                        |

## Processors and recipients

Fill the last column before launch. A processor needs a data-processing agreement (Art. 28).

| Who                                                                  | What they see                                                | Where                           | Agreement                     |
| -------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------- | ----------------------------- |
| Hosting (Coolify on the course infrastructure, Postgres, containers) | everything in the database and logs                          | EU, per the team                | to confirm                    |
| Container registry                                                   | images only, no personal data                                | course infrastructure           | not needed if no data         |
| GitHub (code, CI, review workflows)                                  | code and pull requests; no production data may go there      | US                              | check the org's terms         |
| OpenStreetMap tile servers                                           | IP address and map area of someone using the location picker | outside our control             | none; disclosed in the notice |
| Mail provider (none yet)                                             | e-mail address and message                                   | if Resend: US, needs SCCs / DPF | when one is added             |

## Personal data breach (Art. 33, 34)

1. **Contain:** rotate `BETTER_AUTH_SECRET` (signs everyone out) and `EXPORT_PSEUDONYM_KEY`, remove the leaked access, keep the evidence (logs, time).
2. **Decide within 72 hours of finding out** whether it is likely to put people at risk. If yes, the controller reports to the Office for Personal Data Protection (ÚOOÚ, uoou.gov.cz) with: what happened, which data and roughly how many people, likely consequences, what was done. If not, write down why.
3. **Tell the people** without undue delay when the risk is high (for example leaked e-mail addresses together with reset links).
4. **Record** every breach, reported or not.

Known weak spots to watch: the container logs (shared across the course; the app no longer writes e-mail addresses or links to them), the admin CSV export (each download is logged with the admin's user id), and the seeded superadmin account (replace it with named admins; never ship the default password).

## Before the pilot ends

Decide the end date and what then happens to the data: delete the database, or anonymise it. Say it on the privacy page.
