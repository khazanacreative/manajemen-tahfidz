import { supabase } from "@/integrations/supabase/client";

export const supabaseService = {
  async addUstadz(formData: any): Promise<string> {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          nama_lengkap: formData.nama_lengkap,
          username: formData.username,
        },
      },
    });

    if (authError) throw authError;

    const userId = authData?.user?.id;
    if (!userId) throw new Error("Gagal membuat user");

    const sb = supabase as any;

    const { error: roleError } = await sb.from("user_roles").insert({
      user_id: userId,
      role: "Asatidz",
    });

    if (roleError) throw roleError;

    // Ensure a profile row exists for the user. Use upsert so it works whether the row exists or not.
    const { error: profileError } = await sb.from("profiles").upsert({
      id: userId,
      nama_lengkap: formData.nama_lengkap,
      username: formData.username,
      email: formData.email,
      no_hp: formData.no_hp || null,
      aktif: true,
    });

    if (profileError) throw profileError;

    return userId;
  },

  async updateUstadz(id: string, formData: any) {
    const sb = supabase as any;

    const { data, error } = await sb
      .from("profiles")
      .update({
        nama_lengkap: formData.nama_lengkap,
        username: formData.username,
        email: formData.email,
        no_hp: formData.no_hp,
      })
      .eq("id", id)
      .select()
      .limit(1)
      .single();

    if (error) throw error;

    return data;
  },

  async deleteUstadz(id: string) {
    const sb = supabase as any;

    const { error: roleError } = await sb.from("user_roles").delete().eq("user_id", id).eq("role", "Asatidz");
    if (roleError) throw roleError;

    const { error: profileError } = await sb.from("profiles").update({ aktif: false }).eq("id", id);
    if (profileError) throw profileError;

    return true;
  },
};