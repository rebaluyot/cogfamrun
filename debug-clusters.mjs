import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Environment variables not found, trying localhost defaults...');
  console.log('VITE_SUPABASE_URL:', supabaseUrl);
  console.log('VITE_SUPABASE_PUBLISHABLE_KEY:', supabaseKey ? 'Present' : 'Missing');
}

const supabase = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseKey || 'your-anon-key'
);

async function debugClusters() {
  try {
    console.log('🔍 Fetching clusters...');
    
    const { data, error } = await supabase
      .from('clusters')
      .select('id, name')
      .order('name');
    
    if (error) {
      console.error('❌ Error fetching clusters:', error);
      return;
    }
    
    console.log('✅ Raw clusters data:');
    console.table(data);
    
    // Check for duplicates
    const nameCount = {};
    data.forEach(cluster => {
      nameCount[cluster.name] = (nameCount[cluster.name] || 0) + 1;
    });
    
    const duplicates = Object.entries(nameCount).filter(([name, count]) => count > 1);
    
    if (duplicates.length > 0) {
      console.log('⚠️  Duplicate cluster names found:');
      duplicates.forEach(([name, count]) => {
        console.log(`   - "${name}": ${count} occurrences`);
      });
    } else {
      console.log('✅ No duplicate cluster names found');
    }
    
    // Show the unique clusters that would be displayed
    const uniqueClusters = data.reduce((acc, cluster) => {
      if (!acc.find(c => c.name === cluster.name)) {
        acc.push(cluster);
      }
      return acc;
    }, []);
    
    console.log('\n📋 Unique clusters that will be displayed:');
    console.table(uniqueClusters);
    
  } catch (err) {
    console.error('💥 Script error:', err.message);
  }
}

debugClusters();
