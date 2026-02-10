// Re-export from the central AuthContext to avoid multiple GoTrueClient instances
import { supabase } from '../../contexts/AuthContext';

export { supabase };
export default supabase;
