declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              type?: 'standard' | 'icon';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              logo_alignment?: 'left' | 'center';
              width?: number | string;
            }
          ) => void;
        };
      };
    };
  }
}
export interface GoogleProfile {
  email: string;
  name?: string;
  picture?: string;
  credential?: string;
}
export interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onProfileSelect?: (profile: GoogleProfile) => void;
  className?: string;
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  modalTitle?: string;
}
