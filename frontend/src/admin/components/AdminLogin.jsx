import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Alert, Paper } from '@mui/material';
import { useAdminContext } from '../contexts/AdminContext';

export default function AdminLogin() {
  const [storeId, setStoreId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { login } = useAdminContext();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // 폼 검증
    if (!storeId || !username || !password) {
      setError('모든 필드를 입력해주세요');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await login(storeId, username, password);
      navigate('/admin/dashboard');
    } catch (err) {
      if (err.response?.status === 401) {
        setError('인증 실패. 정보를 확인해주세요');
      } else {
        setError('서버 오류. 잠시 후 다시 시도해주세요');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'grey.100',
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: 400 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          관리자 로그인
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="매장 ID"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="사용자명"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
          />
          
          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={isLoading}
            sx={{ mt: 3 }}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
