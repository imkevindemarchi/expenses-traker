export type AccountIdentityProps = {
  username?: string;
  surname?: string;
  email?: string;
  onLogout?: () => void;
};
export default function useAccountIdentity(props: AccountIdentityProps) {
  return { username: props.username ?? "", surname: props.surname ?? "",
    email: props.email ?? "", onLogout: props.onLogout ?? (() => {}) };
}
