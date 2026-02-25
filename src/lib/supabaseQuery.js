export const fromSupabase = async (query) => {
  const { data, error } = await query;
  if (error) throw error;
  return data;
};
