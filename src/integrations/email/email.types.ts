export type EmailMessage = {
  to: string[];
  subject: string;
  text: string;
  html?: string;
};

// One vendor behind one method. The app never imports a vendor SDK outside a provider file.
export type EmailProvider = {
  readonly name: string;
  send(message: EmailMessage): Promise<void>;
};

export type EmailService = {
  send(message: EmailMessage): Promise<void>;
};
