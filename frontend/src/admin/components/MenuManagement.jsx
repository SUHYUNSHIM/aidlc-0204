import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from '@mui/material';
import { fetchMenus, createMenu, updateMenu, deleteMenu } from '../../api/menus';
import { useAdminContext } from '../contexts/AdminContext';
import { encodeImageToBase64 } from '../../utils/helpers';

export default function MenuManagement() {
  const { adminUser } = useAdminContext();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [formData, setFormData] = useState({
    menuName: '',
    price: '',
    description: '',
    categoryId: 1,
    imageBase64: '',
  });
  const [error, setError] = useState(null);
  
  // 메뉴 조회
  const { data: menus = [], isLoading } = useQuery({
    queryKey: ['menus', adminUser?.storeId],
    queryFn: () => fetchMenus(adminUser.storeId),
    enabled: !!adminUser?.storeId,
    staleTime: 5 * 60 * 1000,
  });
  
  // 메뉴 생성
  const createMutation = useMutation({
    mutationFn: createMenu,
    onSuccess: () => {
      queryClient.invalidateQueries(['menus']);
      handleCloseForm();
    },
  });
  
  // 메뉴 수정
  const updateMutation = useMutation({
    mutationFn: ({ menuId, data }) => updateMenu(menuId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['menus']);
      handleCloseForm();
    },
  });
  
  // 메뉴 삭제
  const deleteMutation = useMutation({
    mutationFn: deleteMenu,
    onSuccess: () => {
      queryClient.invalidateQueries(['menus']);
    },
  });
  
  const handleOpenForm = (menu = null) => {
    if (menu) {
      setEditingMenu(menu);
      setFormData({
        menuName: menu.menu_name,
        price: menu.price,
        description: menu.description || '',
        categoryId: menu.categoryId || menu.category_id || 1,
        imageBase64: menu.image_base64 || '',
      });
    } else {
      setEditingMenu(null);
      setFormData({
        menuName: '',
        price: '',
        description: '',
        categoryId: 1,
        imageBase64: '',
      });
    }
    setShowForm(true);
    setError(null);
  };
  
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingMenu(null);
    setError(null);
  };
  
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const base64 = await encodeImageToBase64(file);
      setFormData(prev => ({ ...prev, imageBase64: base64 }));
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleSubmit = () => {
    // 검증
    if (!formData.menuName) {
      setError('메뉴명을 입력해주세요');
      return;
    }
    if (!formData.price || formData.price <= 0) {
      setError('가격은 0보다 커야 합니다');
      return;
    }
    
    const data = {
      store_id: adminUser.storeId,
      menu_name: formData.menuName,
      price: Number(formData.price),
      description: formData.description,
      category_id: formData.categoryId,
      image_base64: formData.imageBase64 || null,
    };
    
    if (editingMenu) {
      updateMutation.mutate({ menuId: editingMenu.menu_id, data });
    } else {
      createMutation.mutate(data);
    }
  };
  
  const handleDelete = (menuId) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      deleteMutation.mutate(menuId);
    }
  };
  
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">메뉴 관리</Typography>
        <Button variant="contained" onClick={() => handleOpenForm()}>
          메뉴 추가
        </Button>
      </Box>
      
      <Grid container spacing={2}>
        {menus.map(menu => (
          <Grid item xs={12} sm={6} md={4} key={menu.menu_id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{menu.menu_name}</Typography>
                <Typography variant="body1" color="primary">
                  {menu.price.toLocaleString()}원
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {menu.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => handleOpenForm(menu)}>
                  수정
                </Button>
                <Button size="small" color="error" onClick={() => handleDelete(menu.menu_id)}>
                  삭제
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Dialog open={showForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>{editingMenu ? '메뉴 수정' : '메뉴 추가'}</DialogTitle>
        <DialogContent>
          {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
          
          <TextField
            fullWidth
            label="메뉴명"
            value={formData.menuName}
            onChange={(e) => setFormData(prev => ({ ...prev, menuName: e.target.value }))}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="가격"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="설명"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            margin="normal"
            multiline
            rows={3}
          />
          
          <Button variant="outlined" component="label" sx={{ mt: 2 }}>
            이미지 업로드
            <input type="file" hidden accept="image/*" onChange={handleImageChange} />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm}>취소</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingMenu ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
