import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, UserCheck, UserX, Shield, Store } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'

interface User {
  id: string
  full_name: string
  role: 'admin' | 'manager' | 'cashier' | 'baker'
  is_active: boolean
  created_at: string
  email?: string
}

interface StoreType {
  id: string
  name: string
  code: string
}

interface UserStore {
  id: string
  store_id: string
  is_default: boolean
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showStoreModal, setShowStoreModal] = useState(false)
  const [managingUser, setManagingUser] = useState<User | null>(null)
  const [stores, setStores] = useState<StoreType[]>([])
  const [userStores, setUserStores] = useState<UserStore[]>([])
  const { profile } = useAuthStore()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'cashier' as 'admin' | 'manager' | 'cashier' | 'baker',
  })

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchUsers()
      fetchStores()
    }
  }, [profile])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      // Get all profiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get auth users to get emails
      const { data: { users: authUsers } } = await supabase.auth.admin.listUsers()

      // Merge data
      const usersWithEmails = profiles?.map(profile => ({
        ...profile,
        email: authUsers?.find(u => u.id === profile.id)?.email || 'N/A'
      })) || []

      setUsers(usersWithEmails)
    } catch (error: any) {
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const fetchStores = async () => {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (data && !error) {
      setStores(data)
    }
  }

  const fetchUserStores = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_stores')
      .select('*')
      .eq('user_id', userId)

    if (data && !error) {
      setUserStores(data)
    }
  }

  const handleManageStores = async (user: User) => {
    setManagingUser(user)
    await fetchUserStores(user.id)
    setShowStoreModal(true)
  }

  const handleToggleUserStore = async (storeId: string) => {
    if (!managingUser) return

    const existingAssociation = userStores.find(us => us.store_id === storeId)

    try {
      if (existingAssociation) {
        // Remove association
        const { error } = await supabase
          .from('user_stores')
          .delete()
          .eq('id', existingAssociation.id)

        if (error) throw error
        toast.success('Store access removed')
      } else {
        // Add association
        const { error } = await supabase
          .from('user_stores')
          .insert({
            user_id: managingUser.id,
            store_id: storeId,
            is_default: userStores.length === 0 // First store is default
          })

        if (error) throw error
        toast.success('Store access granted')
      }

      await fetchUserStores(managingUser.id)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update store access')
    }
  }

  const handleSetDefaultStore = async (storeId: string) => {
    if (!managingUser) return

    try {
      // Remove default from all stores for this user
      await supabase
        .from('user_stores')
        .update({ is_default: false })
        .eq('user_id', managingUser.id)

      // Set new default
      const { error } = await supabase
        .from('user_stores')
        .update({ is_default: true })
        .eq('user_id', managingUser.id)
        .eq('store_id', storeId)

      if (error) throw error
      toast.success('Default store updated')
      await fetchUserStores(managingUser.id)
    } catch (error: any) {
      toast.error(error.message || 'Failed to set default store')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            role: formData.role,
          })
          .eq('id', editingUser.id)

        if (error) throw error
        toast.success('User updated successfully')
      } else {
        // Create new user via Edge Function
        const { data, error } = await supabase.functions.invoke('create-user', {
          body: {
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name,
            role: formData.role,
          }
        })

        if (error) {
          console.error('Edge Function error:', error)
          throw new Error(`Failed to create user: ${error.message}`)
        }
        
        if (data && !data.success) {
          console.error('Edge Function returned error:', data.error)
          throw new Error(data.error || 'Failed to create user')
        }

        toast.success('User created successfully')
      }

      setShowModal(false)
      resetForm()
      fetchUsers()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save user')
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      email: user.email || '',
      password: '',
      full_name: user.full_name,
      role: user.role,
    })
    setShowModal(true)
  }

  const handleToggleActive = async (user: User) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !user.is_active })
        .eq('id', user.id)

      if (error) throw error
      toast.success(`User ${!user.is_active ? 'activated' : 'deactivated'}`)
      fetchUsers()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return

    try {
      // Delete user via Edge Function
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: id }
      })

      if (error) throw error
      if (!data.success) throw new Error(data.error)

      toast.success('User deleted successfully')
      fetchUsers()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      role: 'cashier',
    })
    setEditingUser(null)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-600'
      case 'manager': return 'bg-blue-100 text-blue-600'
      case 'cashier': return 'bg-green-100 text-green-600'
      case 'baker': return 'bg-orange-100 text-orange-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500">You don't have permission to access this page</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-500 mt-1">{users.length} total users</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={20} className="mr-2" />
          Add User
        </Button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium">{user.full_name}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.is_active ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <UserCheck size={16} />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <UserX size={16} />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleManageStores(user)}
                          className="text-purple-600 hover:text-purple-800"
                          title="Manage stores"
                        >
                          <Store size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit user"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={user.is_active ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}
                          title={user.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {user.is_active ? <UserX size={18} /> : <UserCheck size={18} />}
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete user"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingUser ? 'Edit User' : 'Add New User'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingUser && (
            <>
              <Input
                label="Email *"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Input
                label="Password *"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                placeholder="Minimum 6 characters"
              />
            </>
          )}

          <Input
            label="Full Name *"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            >
              <option value="cashier">Cashier</option>
              <option value="baker">Baker</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.role === 'admin' && 'Full system access'}
              {formData.role === 'manager' && 'Can manage inventory, purchases, and reports'}
              {formData.role === 'cashier' && 'Can access POS only'}
              {formData.role === 'baker' && 'Can manage production and recipes'}
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingUser ? 'Update User' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Role Permissions Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Role Permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-blue-800">Admin</p>
            <p className="text-blue-600">Full system access, user management</p>
          </div>
          <div>
            <p className="font-medium text-blue-800">Manager</p>
            <p className="text-blue-600">Inventory, purchases, production, reports</p>
          </div>
          <div>
            <p className="font-medium text-blue-800">Cashier</p>
            <p className="text-blue-600">POS operations only</p>
          </div>
          <div>
            <p className="font-medium text-blue-800">Baker</p>
            <p className="text-blue-600">Production and recipe management</p>
          </div>
        </div>
      </div>

      {/* Store Management Modal */}
      <Modal
        isOpen={showStoreModal}
        onClose={() => {
          setShowStoreModal(false)
          setManagingUser(null)
          setUserStores([])
        }}
        title={`Manage Stores - ${managingUser?.full_name}`}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Select which stores this user can access. The default store will be selected automatically when they log in.
          </p>

          <div className="space-y-2">
            {stores.map(store => {
              const userStore = userStores.find(us => us.store_id === store.id)
              const hasAccess = !!userStore
              const isDefault = userStore?.is_default || false

              return (
                <div
                  key={store.id}
                  className={`p-4 border rounded-lg ${hasAccess ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={hasAccess}
                        onChange={() => handleToggleUserStore(store.id)}
                        className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{store.name}</p>
                        <p className="text-sm text-gray-500">Code: {store.code}</p>
                      </div>
                    </div>

                    {hasAccess && (
                      <button
                        onClick={() => handleSetDefaultStore(store.id)}
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          isDefault
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {isDefault ? '✓ Default' : 'Set Default'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {userStores.length === 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ This user has no store access. Please assign at least one store.
              </p>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button
              onClick={() => {
                setShowStoreModal(false)
                setManagingUser(null)
                setUserStores([])
              }}
              variant="secondary"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
