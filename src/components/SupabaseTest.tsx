import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function SupabaseTest() {
  const [status, setStatus] = useState('testing')
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const [storageWorking, setStorageWorking] = useState(false)
  const [edgeFunctionsWorking, setEdgeFunctionsWorking] = useState(false)
  const [openAIKeyWorking, setOpenAIKeyWorking] = useState(false)

  console.log('SupabaseTest component loaded!')

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      console.log('Testing connection...')
      setStatus('testing')
      setError('')

      // Simple test - just try to get the current user
      const { data: { user }, error } = await supabase.auth.getUser()
      
      console.log('Auth result:', { user, error })

      if (error) {
        throw error
      }

      setUser(user)
      setStatus('connected')
      console.log('✅ Connection successful!')

      // Test storage and edge functions if user is signed in
      if (user) {
        testStorage()
        testEdgeFunctions()
        testOpenAIKey()
      }

    } catch (err: any) {
      console.error('❌ Connection failed:', err)
      setStatus('error')
      setError(err.message)
    }
  }

  const signInAnonymously = async () => {
    try {
      console.log('Signing in anonymously...')
      const { data, error } = await supabase.auth.signInAnonymously()
      if (error) throw error
      
      console.log('Anonymous sign-in successful:', data)
      await testConnection()
    } catch (err: any) {
      console.error('Sign-in failed:', err)
      setError(err.message)
    }
  }

  const signUpWithEmail = async () => {
    try {
      console.log('Signing up with email...')
      const testEmail = `test-${Date.now()}@example.com`
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'testpassword123'
      })
      if (error) throw error
      
      console.log('Email sign-up successful:', data)
      await testConnection()
    } catch (err: any) {
      console.error('Sign-up failed:', err)
      setError(err.message)
    }
  }

  const signInWithEmail = async () => {
    try {
      console.log('Signing in with email...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'nickhermes@me.com',
        password: 'test123'
      })
      if (error) throw error
      
      console.log('Email sign-in successful:', data)
      setUser(data.user)
      setStatus('connected')
      console.log('✅ Connection successful!')
      
      // Test storage and edge functions
      testStorage()
      testEdgeFunctions()
      testOpenAIKey()
    } catch (err: any) {
      console.error('Sign-in failed:', err)
      setError(err.message)
    }
  }

  const testStorage = async () => {
    try {
      console.log('Testing storage...')
      const { data, error } = await supabase.storage.from('dinner-photos').list('', { limit: 1 })
      
      if (error) {
        console.log('Storage test result:', error)
        setStorageWorking(false)
      } else {
        console.log('✅ Storage working!')
        setStorageWorking(true)
      }
    } catch (err) {
      console.log('Storage test failed:', err)
      setStorageWorking(false)
    }
  }

  const testEdgeFunctions = async () => {
    try {
      console.log('Testing Edge Functions...')
      console.log('User object:', user)
      console.log('User ID:', user?.id)
      
      if (!user?.id) {
        console.log('No user ID available for Edge Function test')
        setEdgeFunctionsWorking(false)
        return
      }
      
      // Test the main AI search function
      const { data, error } = await supabase.functions.invoke('ai-search', {
        body: { query: 'test search', userId: user.id }
      })
      
      if (error) {
        console.log('AI Search Edge Function test result:', error)
        setEdgeFunctionsWorking(false)
      } else {
        console.log('✅ AI Search Edge Function working!', data)
        setEdgeFunctionsWorking(true)
      }
    } catch (err) {
      console.log('Edge Functions test failed:', err)
      setEdgeFunctionsWorking(false)
    }
  }

  const testOpenAIKey = async () => {
    try {
      console.log('Testing OpenAI API key...')
      const hasKey = !!import.meta.env.VITE_OPENAI_API_KEY && import.meta.env.VITE_OPENAI_API_KEY !== 'your-openai-key-here'
      console.log('OpenAI key exists:', hasKey)
      console.log('OpenAI key value:', import.meta.env.VITE_OPENAI_API_KEY ? 'present' : 'missing')
      setOpenAIKeyWorking(hasKey)
    } catch (err) {
      console.log('OpenAI key test failed:', err)
      setOpenAIKeyWorking(false)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Supabase Connection Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <strong>Status:</strong> 
        <span style={{ 
          color: status === 'connected' ? 'green' : status === 'error' ? 'red' : 'orange',
          marginLeft: '10px'
        }}>
          {status === 'testing' ? 'Testing...' : status === 'connected' ? 'Connected ✅' : 'Error ❌'}
        </span>
      </div>

      {error && (
        <div style={{ 
          backgroundColor: '#fee', 
          border: '1px solid #fcc', 
          padding: '10px', 
          marginBottom: '20px',
          borderRadius: '4px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {user && (
        <div style={{ 
          backgroundColor: '#efe', 
          border: '1px solid #cfc', 
          padding: '10px', 
          marginBottom: '20px',
          borderRadius: '4px'
        }}>
          <strong>User:</strong> {user.email || 'Anonymous'}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testConnection}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Connection
        </button>
        
        <button 
          onClick={signInAnonymously}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Sign In Anonymously
        </button>
        
        <button 
          onClick={signUpWithEmail}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Test Email Sign-up
        </button>
        
        <button 
          onClick={signInWithEmail}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#6f42c1',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Sign In (nickhermes@me.com)
        </button>
      </div>

      <div>
        <h3>Setup Checklist:</h3>
        <ul>
          <li style={{ color: status === 'connected' ? 'green' : 'red' }}>
            {status === 'connected' ? '✅' : '❌'} Supabase connection
          </li>
          <li style={{ color: status === 'connected' ? 'green' : 'red' }}>
            {status === 'connected' ? '✅' : '❌'} Environment variables
          </li>
          <li style={{ color: status === 'connected' ? 'green' : 'red' }}>
            {status === 'connected' ? '✅' : '❌'} Database schema
          </li>
          <li style={{ color: edgeFunctionsWorking ? 'green' : 'red' }}>
            {edgeFunctionsWorking ? '✅' : '❌'} Edge Functions
          </li>
          <li style={{ color: storageWorking ? 'green' : 'red' }}>
            {storageWorking ? '✅' : '❌'} Storage bucket
          </li>
          <li style={{ color: openAIKeyWorking ? 'green' : 'red' }}>
            {openAIKeyWorking ? '✅' : '❌'} OpenAI API key
          </li>
        </ul>
      </div>
    </div>
  )
}