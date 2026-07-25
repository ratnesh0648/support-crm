const VALID_STATUSES = ["Open", "In Progress", "Closed"];
const VALID_PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const VALID_NOTE_TYPES = ["customer", "internal"];

const AGENTS = [
  { id: "alex", name: "Alex Rivera", role: "Agent" },
  { id: "sam", name: "Sam Okonkwo", role: "Agent" },
  { id: "jordan", name: "Jordan Lee", role: "Lead" },
  { id: "priya", name: "Priya Shah", role: "Agent" },
];

const SLA_FIRST_RESPONSE_HOURS = 4;
const SLA_RESOLVE_HOURS = 24;

const REPLY_TEMPLATES = [
  {
    id: "looking",
    label: "Looking into it",
    text: "Thanks for reaching out — we're looking into this and will update you shortly.",
  },
  {
    id: "need-info",
    label: "Need more info",
    text: "Could you share a bit more detail (screenshots, steps, or error messages) so we can dig in?",
  },
  {
    id: "resolved",
    label: "Resolved",
    text: "This should now be fixed on your end. Please reply if anything still looks off — happy to reopen.",
  },
  {
    id: "escalated",
    label: "Escalated",
    text: "We've escalated this to a specialist and will follow up as soon as we have news.",
  },
];

module.exports = {
  VALID_STATUSES,
  VALID_PRIORITIES,
  VALID_NOTE_TYPES,
  AGENTS,
  SLA_FIRST_RESPONSE_HOURS,
  SLA_RESOLVE_HOURS,
  REPLY_TEMPLATES,
};
