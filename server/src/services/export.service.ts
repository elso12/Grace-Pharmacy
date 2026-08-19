import { parse } from 'json2csv';

export const exportToCSV = (data: any[], fields: string[]) => {
  try {
    const csv = parse(data, { fields });
    return csv;
  } catch (err) {
    console.error('[CSV EXPORT ERROR]', err);
    throw new Error('Failed to generate CSV export');
  }
};
