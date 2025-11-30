import { supabase } from "@/integrations/supabase/client";

export const uploadProfilePicture = async (
  userId: string,
  file: File
): Promise<string> => {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image must be less than 5MB');
    }

    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error: any) {
    console.error('Error uploading image:', error);
    throw new Error(error.message || 'Failed to upload image');
  }
};

export const deleteProfilePicture = async (url: string): Promise<void> => {
  try {
    // Extract file path from URL
    const urlParts = url.split('/profile-pictures/');
    if (urlParts.length !== 2) return;

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from('profile-pictures')
      .remove([filePath]);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting image:', error);
  }
};
