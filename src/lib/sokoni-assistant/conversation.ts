// Sokoni Arena — multi-turn conversational state machine.
// Powers Yes/No follow-up flows like:
//   "What is Fun Circle?" → explain → "Want to know its advantages?" → yes → list →
//   "Want me to take you there?" → checks login → guide → navigate.

export type FlowStep = {
  /** What the assistant says now. */
  reply: string;
  /** Optional navigation to perform AFTER user confirms (next yes). */
  navigateOnYes?: string;
  /** If present, this step is asking a yes/no follow-up. */
  followUp?: string;
  /** Next step id when the user says YES. */
  nextOnYes?: string;
  /** Next step id when the user says NO. */
  nextOnNo?: string;
  /** When true, branch on auth status before proceeding. */
  requiresLoginCheck?: boolean;
  /** Step to jump to when logged in. */
  ifLoggedIn?: string;
  /** Step to jump to when NOT logged in. */
  ifLoggedOut?: string;
};

export type Flow = {
  id: string;
  /** Triggers (lowercase) — when found in the user's message, this flow starts. */
  triggers: string[];
  steps: Record<string, FlowStep>;
  startStep: string;
};

export const FLOWS: Flow[] = [
  // ─── Fun Circle deep guide ─────────────────────────────
  {
    id: "fun-circle",
    triggers: ["fun circle", "funcircle", "fun-circle", "social circle"],
    startStep: "intro",
    steps: {
      intro: {
        reply: "Sokoni Fun Circle is the social side of Sokoni Arena — a private feed where you and your friends post 24-hour stories, react, comment and DM each other while still browsing the marketplace.",
        followUp: "Would you like to know its advantages and capabilities?",
        nextOnYes: "advantages",
        nextOnNo: "offer-nav",
      },
      advantages: {
        reply: "Advantages: 1) Stories disappear in 24h so it stays fresh. 2) Friend suggestions help you grow your circle. 3) Direct messages with sellers and friends in one inbox. 4) React, comment and share listings with friends. 5) Profile previews show your shop and listings — great for sellers.",
        followUp: "Would you like me to guide you on how to get going with Fun Circle?",
        nextOnYes: "how-to",
        nextOnNo: "offer-nav",
      },
      "how-to": {
        reply: "How it works: 1) Open Fun Circle from the menu. 2) Tap '+' to post a story (photo, video or text). 3) Use the friends panel to add people. 4) Tap any story to react or reply. 5) Open Messages for one-on-one chats.",
        followUp: "Would you like me to take you to the Fun Circle page now?",
        nextOnYes: "auth-gate",
        nextOnNo: "done",
      },
      "offer-nav": {
        reply: "Sawa.",
        followUp: "Want me to open Fun Circle for you?",
        nextOnYes: "auth-gate",
        nextOnNo: "done",
      },
      "auth-gate": {
        reply: "Checking your account…",
        requiresLoginCheck: true,
        ifLoggedIn: "go",
        ifLoggedOut: "ask-account",
      },
      "ask-account": {
        reply: "Fun Circle needs you to be signed in.",
        followUp: "Have you already created an account?",
        nextOnYes: "login-help",
        nextOnNo: "register-help",
      },
      "login-help": {
        reply: "To log in: 1) Tap 'Login' in the menu. 2) Enter your email and password. 3) If you forgot the password, tap 'Forgot password' and we'll email you a reset link. After signing in, your session stays active so you don't have to re-login each visit.",
        followUp: "Want me to take you to the login page?",
        nextOnYes: "go-login",
        nextOnNo: "done",
      },
      "register-help": {
        reply: "Creating an account is quick: 1) Tap 'Register'. 2) Enter your name, email and a strong password (mix of letters, numbers and a symbol — keep it private). 3) Submit. 4) Check your email and click the confirmation link to activate the account. 5) Come back, log in, complete your profile (avatar, bio, location) and you're ready. Tip: use a password manager and never share your password — Sokoni Arena will never ask for it.",
        followUp: "Want me to open the registration page?",
        nextOnYes: "go-register",
        nextOnNo: "done",
      },
      go: {
        reply: "Opening Fun Circle for you. Twende!",
        navigateOnYes: "/fun-circle",
      },
      "go-login": {
        reply: "Opening the login page.",
        navigateOnYes: "/login",
      },
      "go-register": {
        reply: "Opening the registration page.",
        navigateOnYes: "/register",
      },
      done: {
        reply: "Sawa, holler when you need me.",
      },
    },
  },

  // ─── Open a shop guide ─────────────────────────────────
  {
    id: "open-shop",
    triggers: ["open a shop", "open shop", "create shop", "start a shop", "start shop", "my shop"],
    startStep: "intro",
    steps: {
      intro: {
        reply: "A shop on Sokoni Arena is your branded storefront — your own page with logo, cover image, listings, followers and analytics.",
        followUp: "Would you like the step-by-step guide to opening one?",
        nextOnYes: "steps",
        nextOnNo: "done",
      },
      steps: {
        reply: "Steps: 1) Sign in. 2) Open the Dashboard. 3) Tap 'My Shop' → 'Create Shop'. 4) Add name, logo, cover, description and contact details (phone + WhatsApp). 5) Submit for verification. 6) Once approved, add listings and request promotion if you want to appear on the homepage.",
        followUp: "Want me to take you to the Dashboard now?",
        nextOnYes: "auth-gate",
        nextOnNo: "done",
      },
      "auth-gate": {
        reply: "Checking your account…",
        requiresLoginCheck: true,
        ifLoggedIn: "go",
        ifLoggedOut: "go-login",
      },
      go: { reply: "Opening your Dashboard.", navigateOnYes: "/dashboard" },
      "go-login": { reply: "Sign in first — opening login.", navigateOnYes: "/login" },
      done: { reply: "Got it. Just say the word when you're ready." },
    },
  },

  // ─── Post a listing guide ──────────────────────────────
  {
    id: "post-listing",
    triggers: ["post listing", "post an ad", "post ad", "create listing", "list product", "sell something", "new listing", "add listing"],
    startStep: "intro",
    steps: {
      intro: {
        reply: "Posting on Sokoni Arena is free for basic listings.",
        followUp: "Want me to walk you through how?",
        nextOnYes: "steps",
        nextOnNo: "done",
      },
      steps: {
        reply: "Steps: 1) Sign in. 2) Open the Dashboard. 3) Tap 'New Listing' and pick Product, Service or Event. 4) Add 3+ clear photos, a sharp title, price (KES), location and category. 5) Hit Publish — it goes live instantly. Pro tip: featured listings appear at the top of search and category pages.",
        followUp: "Take you to the Dashboard now?",
        nextOnYes: "auth-gate",
        nextOnNo: "done",
      },
      "auth-gate": { reply: "Checking…", requiresLoginCheck: true, ifLoggedIn: "go", ifLoggedOut: "go-login" },
      go: { reply: "Opening the new-listing form.", navigateOnYes: "/dashboard?action=new-listing" },
      "go-login": { reply: "Sign in first — opening login.", navigateOnYes: "/login" },
      done: { reply: "Sawa." },
    },
  },

  // ─── Profile completion guide ──────────────────────────
  {
    id: "complete-profile",
    triggers: ["complete profile", "create profile", "edit profile", "profile picture", "upload profile", "my profile"],
    startStep: "intro",
    steps: {
      intro: {
        reply: "A complete profile builds buyer trust and unlocks full features.",
        followUp: "Want the quick guide?",
        nextOnYes: "steps",
        nextOnNo: "done",
      },
      steps: {
        reply: "1) Sign in and open the Dashboard. 2) Click your avatar → 'Edit Profile'. 3) Upload a clear avatar (a real face photo wins more sales). 4) Add username, bio, location and verify your phone. 5) For sellers, link your shop. Save — you're set.",
        followUp: "Open the profile editor now?",
        nextOnYes: "auth-gate",
        nextOnNo: "done",
      },
      "auth-gate": { reply: "Checking…", requiresLoginCheck: true, ifLoggedIn: "go", ifLoggedOut: "go-login" },
      go: { reply: "Opening your profile.", navigateOnYes: "/dashboard?tab=profile" },
      "go-login": { reply: "Sign in first.", navigateOnYes: "/login" },
      done: { reply: "Cool, ping me when ready." },
    },
  },

  // ─── Password change ───────────────────────────────────
  {
    id: "password",
    triggers: ["change password", "reset password", "forgot password", "new password"],
    startStep: "intro",
    steps: {
      intro: {
        reply: "To change or reset your password: 1) Open 'Forgot password' from the login page. 2) Enter your email. 3) Click the reset link in your inbox (check spam too). 4) Set a strong NEW password — 12+ chars, mix letters, numbers and a symbol. 5) Confirm it. Never share your password — Sokoni Arena will never ask for it via chat.",
        followUp: "Want me to open the password reset page?",
        nextOnYes: "go",
        nextOnNo: "done",
      },
      go: { reply: "Opening it.", navigateOnYes: "/forgot-password" },
      done: { reply: "Sawa, ask anytime." },
    },
  },
];

// ─── Runtime ────────────────────────────────────────────
export type FlowState = {
  flowId: string;
  stepId: string;
};

const YES_RE = /\b(yes|yeah|yep|sure|please|ok|okay|sawa|poa|ndio|haya|absolutely|of course|go ahead|do it|take me|why not)\b/i;
const NO_RE = /\b(no|nope|not now|later|cancel|stop|hapana|sitaki|skip)\b/i;

export type FlowAdvance =
  | { type: "reply"; reply: string; navigate?: string; state?: FlowState; ended?: boolean }
  | { type: "no_flow" };

export function findFlow(text: string): Flow | null {
  const t = text.toLowerCase();
  for (const f of FLOWS) {
    if (f.triggers.some((tr) => t.includes(tr))) return f;
  }
  return null;
}

export function startFlow(flow: Flow, ctx: { isLoggedIn: boolean }): FlowAdvance {
  return runStep(flow, flow.startStep, ctx);
}

export function continueFlow(state: FlowState, userText: string, ctx: { isLoggedIn: boolean }): FlowAdvance {
  const flow = FLOWS.find((f) => f.id === state.flowId);
  if (!flow) return { type: "no_flow" };
  const step = flow.steps[state.stepId];
  if (!step) return { type: "no_flow" };

  const yes = YES_RE.test(userText);
  const no = NO_RE.test(userText);

  // If the previous step had a follow-up, branch on yes/no.
  if (step.followUp) {
    if (yes && step.nextOnYes) return runStep(flow, step.nextOnYes, ctx);
    if (no && step.nextOnNo) return runStep(flow, step.nextOnNo, ctx);
    if (yes && step.navigateOnYes) {
      return { type: "reply", reply: step.reply, navigate: step.navigateOnYes, ended: true };
    }
    if (no) return { type: "reply", reply: "Sawa, no problem.", ended: true };
  }
  // No clear yes/no → exit flow so normal intent matching can run.
  return { type: "no_flow" };
}

function runStep(flow: Flow, stepId: string, ctx: { isLoggedIn: boolean }): FlowAdvance {
  const step = flow.steps[stepId];
  if (!step) return { type: "no_flow" };

  // Login gate: jump immediately to the right branch.
  if (step.requiresLoginCheck) {
    const next = ctx.isLoggedIn ? step.ifLoggedIn : step.ifLoggedOut;
    if (next) return runStep(flow, next, ctx);
  }

  let reply = step.reply;
  if (step.followUp) reply = `${reply}\n\n${step.followUp}`;

  // If this step has an immediate navigation (no follow-up), do it now.
  if (step.navigateOnYes && !step.followUp) {
    return { type: "reply", reply, navigate: step.navigateOnYes, ended: true };
  }

  if (step.followUp) {
    return { type: "reply", reply, state: { flowId: flow.id, stepId }, ended: false };
  }

  return { type: "reply", reply, ended: true };
}
