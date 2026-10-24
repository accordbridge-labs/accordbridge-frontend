export type Milestone = {
  name: string;
  amount: string;
  scope: string;
  criteria: string;
  dueDate: string;
};
export type Agreement = {
  title: string;
  description: string;
  exclusions: string;
  revisions: number;
  reviewDays: number;
  milestones: Milestone[];
};

export const emptyMilestone = (): Milestone => ({
  name: "",
  amount: "",
  scope: "",
  criteria: "",
  dueDate: "",
});
export const emptyAgreement = (): Agreement => ({
  title: "",
  description: "",
  exclusions: "",
  revisions: 2,
  reviewDays: 7,
  milestones: [emptyMilestone()],
});
export const sampleAgreement = (): Agreement => ({
  title: "Northstar website",
  description:
    "Five pages. One shared plan. A better website for Northstar Studio.",
  exclusions: "Online store and copywriting",
  revisions: 2,
  reviewDays: 7,
  milestones: [
    {
      name: "Design",
      amount: "150",
      scope:
        "Create the Home, About, Services, Work, and Contact page layouts for Northstar Studio.",
      criteria:
        "Five agreed page layouts\nDesktop and mobile designs\nNamed page sections present",
      dueDate: "2026-10-15",
    },
    {
      name: "Development",
      amount: "300",
      scope: "Implement the approved designs.",
      criteria: "Working contact form\nAgreed browser and mobile checks",
      dueDate: "2026-10-22",
    },
    {
      name: "Handover",
      amount: "150",
      scope: "Deliver the completed website and handover materials.",
      criteria: "Source files\nDeployment instructions\nAgreed walkthrough",
      dueDate: "2026-10-25",
    },
  ],
});
export const cents = (amount: string) => Math.round(Number(amount) * 100);
export const total = (agreement: Agreement) =>
  agreement.milestones.reduce((sum, item) => sum + cents(item.amount), 0) / 100;
export const payout = (amount: string) => {
  const gross = cents(amount);
  const fee = Math.round((gross * 3) / 1000);
  return { gross: gross / 100, fee: fee / 100, net: (gross - fee) / 100 };
};
export type AgreementError = { field: string; message: string };
export function agreementErrors(agreement: Agreement): AgreementError[] {
  const errors: AgreementError[] = [];
  const add = (field: string, message: string) =>
    errors.push({ field, message });
  if (!agreement.title.trim() || agreement.title.length > 100)
    add("title", "Enter a project title of 1–100 characters.");
  if (!agreement.description.trim() || agreement.description.length > 2000)
    add("description", "Enter a project description of 1–2000 characters.");
  if (!agreement.exclusions.trim() || agreement.exclusions.length > 2000)
    add(
      "exclusions",
      "List exclusions, or enter ‘None’ (maximum 2000 characters).",
    );
  if (
    !Number.isInteger(agreement.revisions) ||
    agreement.revisions < 0 ||
    agreement.revisions > 10
  )
    add("revisions", "Choose 0–10 revision rounds.");
  if (
    !Number.isInteger(agreement.reviewDays) ||
    agreement.reviewDays < 1 ||
    agreement.reviewDays > 30
  )
    add("reviewDays", "Choose a review period of 1–30 days.");
  if (!agreement.milestones.length || agreement.milestones.length > 10)
    add("milestones", "Include 1–10 milestones.");
  agreement.milestones.forEach((item, index) => {
    const prefix = `Milestone ${index + 1}: `;
    if (!item.name.trim() || item.name.length > 100)
      add(
        `milestones.${index}.name`,
        prefix + "enter a name of 1–100 characters.",
      );
    if (
      !/^\d+(\.\d{1,2})?$/.test(item.amount) ||
      cents(item.amount) < 1 ||
      cents(item.amount) > 100_000_000
    )
      add(
        `milestones.${index}.amount`,
        prefix + "enter 0.01–1,000,000 USDC, with at most two decimal places.",
      );
    if (!item.scope.trim() || item.scope.length > 2000)
      add(
        `milestones.${index}.scope`,
        prefix + "enter the deliverables (maximum 2000 characters).",
      );
    if (!item.criteria.trim() || item.criteria.length > 2000)
      add(
        `milestones.${index}.criteria`,
        prefix + "enter acceptance criteria (maximum 2000 characters).",
      );
    const date = new Date(item.dueDate + "T00:00:00Z");
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(item.dueDate) ||
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== item.dueDate
    )
      add(
        `milestones.${index}.dueDate`,
        prefix + "choose a valid delivery date.",
      );
  });
  return errors;
}

export function validateAgreement(agreement: Agreement): string[] {
  return agreementErrors(agreement).map((error) => error.message);
}
