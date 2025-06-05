import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase connection details
const SUPABASE_URL = "https://lkumpuiyepjtztdwtcwg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrdW1wdWl5ZXBqdHp0ZHd0Y3dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NDcyNzEsImV4cCI6MjA2NDQyMzI3MX0.1oa22qd-aPgAzz602J112n_Gnv3nr3d8TULXcACp8mk";

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Read the RLS fix SQL file
const sqlFilePath = path.join(__dirname, '../supabase/migrations/20250605_fix_payment_methods_rls.sql');
const sqlContent = readFileSync(sqlFilePath, 'utf8');

// Split into individual statements
const statements = sqlContent
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

// Show diagnostics info
app.get('/api/diagnostics', async (req, res) => {
  try {
    // Test payment method operations
    const { data: getResult, error: getError } = await supabase
      .from('payment_methods')
      .select('*')
      .limit(1);
      
    const testData = { 
      name: 'Test Method ' + Date.now(),
      account_number: '0000-0000-0000',
      account_type: 'test',
      active: false
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('payment_methods')
      .insert([testData])
      .select();
      
    let updateResult = null;
    let updateError = null;
    let deleteResult = null;
    let deleteError = null;
    
    if (insertResult && insertResult.length > 0) {
      const testId = insertResult[0].id;
      
      const updateResponse = await supabase
        .from('payment_methods')
        .update({ name: 'Updated Test ' + Date.now() })
        .eq('id', testId)
        .select();
        
      updateResult = updateResponse.data;
      updateError = updateResponse.error;
      
      const deleteResponse = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', testId);
        
      deleteResult = deleteResponse.data;
      deleteError = deleteResponse.error;
    }
    
    res.json({
      supabaseUrl: SUPABASE_URL,
      operations: {
        select: { success: !getError, error: getError?.message },
        insert: { success: !insertError, error: insertError?.message },
        update: { success: !updateError, error: updateError?.message },
        delete: { success: !deleteError, error: deleteError?.message }
      },
      sqlStatements: statements.length,
      fixInstructions: 'To apply the fix, run the SQL in the Supabase dashboard SQL Editor.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve HTML page with instructions
app.get('/', (req, res) => {
  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Payment Methods RLS Fix</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
      pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
      .success { color: green; }
      .error { color: red; }
      .button { background: #4CAF50; border: none; color: white; padding: 10px 20px; 
               text-align: center; text-decoration: none; display: inline-block; 
               font-size: 16px; margin: 4px 2px; cursor: pointer; border-radius: 5px; }
      .copy-button { background: #2196F3; }
      #diagnostics { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px; }
    </style>
  </head>
  <body>
    <h1>Payment Methods RLS Fix</h1>
    <p>This tool will help you fix the Row-Level Security (RLS) policies for payment methods.</p>
    
    <h2>Diagnostics</h2>
    <div id="diagnostics">Loading diagnostics...</div>
    
    <h2>SQL Fix</h2>
    <p>To fix the RLS policies, copy and run the following SQL in your Supabase SQL Editor:</p>
    <button class="button copy-button" onclick="copySQL()">Copy SQL</button>
    <pre id="sql-code">${sqlContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    
    <script>
      // Load diagnostics data
      fetch('/api/diagnostics')
        .then(response => response.json())
        .then(data => {
          const div = document.getElementById('diagnostics');
          let html = '<h3>Operations Test</h3><ul>';
          
          for (const [op, result] of Object.entries(data.operations)) {
            const className = result.success ? 'success' : 'error';
            const icon = result.success ? '✅' : '❌';
            html += \`<li><strong>\${op}</strong>: <span class="\${className}">\${icon} \${result.success ? 'Working' : \`Failed: \${result.error}\`}</span></li>\`;
          }
          
          html += '</ul>';
          html += \`<p><strong>SQL Statements to Fix:</strong> \${data.sqlStatements}</p>\`;
          html += \`<p><strong>Supabase Project:</strong> \${data.supabaseUrl}</p>\`;
          
          div.innerHTML = html;
        })
        .catch(error => {
          document.getElementById('diagnostics').innerHTML = \`<p class="error">Error loading diagnostics: \${error.message}</p>\`;
        });
      
      // Copy SQL function
      function copySQL() {
        const sqlCode = document.getElementById('sql-code').textContent;
        navigator.clipboard.writeText(sqlCode)
          .then(() => alert('SQL copied to clipboard!'))
          .catch(err => alert('Failed to copy SQL: ' + err));
      }
    </script>
  </body>
  </html>
  `;
  
  res.send(htmlContent);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`RLS Fix server running at http://localhost:${PORT}`);
  console.log(`Open the above URL in your browser for instructions on fixing the RLS policies`);
});

// Run the fix
applyRLSFix();
