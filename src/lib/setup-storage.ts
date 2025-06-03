import { supabase } from "@/integrations/supabase/client";

export const setupStorage = async (): Promise<boolean> => {
  try {
    // Try to create the bucket if it doesn't exist
    const { data, error: createError } = await supabase
      .storage
      .createBucket('registration-files', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
        fileSizeLimit: 5242880, // 5MB in bytes
      });

    // Ignore error if bucket already exists
    if (createError && !createError.message.includes('Bucket already exists')) {
      console.error('Error creating bucket:', createError);
      throw createError;
    }

    // Update bucket to be public
    const { error: updateError } = await supabase
      .storage
      .updateBucket('registration-files', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
        fileSizeLimit: 5242880,
      });

    if (updateError) {
      console.error('Error updating bucket:', updateError);
      throw updateError;
    }    // Get bucket policy to verify it's set up
    const { data: bucketData, error: policyError } = await supabase.storage.getBucket('registration-files');

    if (policyError) {
      console.error('Error getting bucket policy:', policyError);
      throw policyError;
    }

    // Verify bucket is public
    if (!bucketData.public) {
      console.error('Bucket is not public');
      throw new Error('Bucket is not public');
    }

    console.log('Storage bucket setup completed successfully');
    return true;
  } catch (error) {
    console.error('Error setting up storage:', error);
    throw error;
  }
};
