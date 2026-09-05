import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AuthLayout from './AuthLayout';

export default function PromptPassword() {
  return <AuthLayout title="Set a password" icon="Lock" description="Create or change your password from your account settings."><Button asChild className="w-full"><Link to="/change-password">Change password</Link></Button></AuthLayout>;
}
