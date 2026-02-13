import { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  useCustomerDetail,
  useCustomerContacts,
  useCustomerSites,
  useSoftDeleteCustomerMutation,
  useCreateCustomerContactMutation,
  useUpdateCustomerContactMutation,
  useDeleteCustomerContactMutation,
  useCreateCustomerSiteMutation,
  useUpdateCustomerSiteMutation,
  useSoftDeleteCustomerSiteMutation,
  useMyCompanies,
} from '@repo/api-client';
import type { CustomerContact, CustomerSite } from '@repo/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemedButton } from '@/components/ui/button';
import { ThemedInput } from '@/components/ui/input';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const typeColors: Record<string, string> = {
  individual: '#3b82f6',
  company: '#a855f7',
  government: '#f59e0b',
};

const statusColors: Record<string, string> = {
  active: '#22c55e',
  inactive: '#6b7280',
  prospect: '#3b82f6',
};

export default function CustomerDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const customerId = params.id;

  const { data: companiesResult } = useMyCompanies();
  const companyId = companiesResult?.data?.[0]?.company_id;

  const { data: result, isLoading, error } = useCustomerDetail(customerId);
  const { data: contactsResult } = useCustomerContacts(customerId);
  const { data: sitesResult } = useCustomerSites(customerId);

  const customer = result?.data;
  const contacts = contactsResult?.data ?? [];
  const sites = sitesResult?.data ?? [];

  // Mutations
  const deleteMutation = useSoftDeleteCustomerMutation();
  const createContactMutation = useCreateCustomerContactMutation();
  const updateContactMutation = useUpdateCustomerContactMutation();
  const deleteContactMutation = useDeleteCustomerContactMutation();
  const createSiteMutation = useCreateCustomerSiteMutation();
  const updateSiteMutation = useUpdateCustomerSiteMutation();
  const deleteSiteMutation = useSoftDeleteCustomerSiteMutation();

  // Contact state
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    role: '',
    department: '',
    email: '',
    is_primary: false,
  });

  // Site state
  const [showAddSite, setShowAddSite] = useState(false);
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [newSite, setNewSite] = useState({
    name: '',
    address: '',
    city: '',
    gps_coordinates: '',
    landmarks: '',
  });

  // Edit contact state
  const [editContact, setEditContact] = useState({
    name: '',
    phone: '',
    role: '',
    department: '',
    email: '',
    is_primary: false,
  });

  // Edit site state
  const [editSite, setEditSite] = useState({
    name: '',
    address: '',
    city: '',
    gps_coordinates: '',
    landmarks: '',
  });

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <MaterialIcons name="access-time" size={48} color="#9ca3af" />
        <ThemedText>Loading customer details...</ThemedText>
      </ThemedView>
    );
  }

  if (error || !customer) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>
          {error?.message ?? 'Customer not found'}
        </ThemedText>
      </ThemedView>
    );
  }

  const handleDeleteCustomer = () => {
    if (!customerId || !companyId) return;
    Alert.alert('Delete Customer', 'Are you sure you want to delete this customer?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const result = await deleteMutation.mutateAsync({ customerId, companyId });
          if (!result.error) {
            router.back();
          } else {
            Alert.alert('Error', result.error.message);
          }
        },
      },
    ]);
  };

  // ---- Contact handlers ----
  const handleAddContact = async () => {
    if (!customerId || !newContact.name.trim() || !newContact.phone.trim()) return;
    const result = await createContactMutation.mutateAsync({
      customerId,
      payload: {
        name: newContact.name,
        phone: newContact.phone,
        ...(newContact.role && { role: newContact.role }),
        ...(newContact.department && { department: newContact.department }),
        ...(newContact.email && { email: newContact.email }),
        is_primary: newContact.is_primary,
      },
    });
    if (!result.error) {
      setNewContact({ name: '', phone: '', role: '', department: '', email: '', is_primary: false });
      setShowAddContact(false);
    } else {
      Alert.alert('Error', result.error.message);
    }
  };

  const handleStartEditContact = (contact: CustomerContact) => {
    setEditingContactId(contact.id);
    setEditContact({
      name: contact.name,
      phone: contact.phone,
      role: contact.role ?? '',
      department: contact.department ?? '',
      email: contact.email ?? '',
      is_primary: contact.is_primary,
    });
  };

  const handleSaveEditContact = async () => {
    if (!editingContactId || !customerId) return;
    const result = await updateContactMutation.mutateAsync({
      contactId: editingContactId,
      customerId,
      payload: {
        name: editContact.name,
        phone: editContact.phone,
        role: editContact.role || null,
        department: editContact.department || null,
        email: editContact.email || null,
        is_primary: editContact.is_primary,
      },
    });
    if (!result.error) {
      setEditingContactId(null);
    } else {
      Alert.alert('Error', result.error.message);
    }
  };

  const handleDeleteContact = (contactId: string, name: string) => {
    if (!customerId) return;
    Alert.alert('Delete Contact', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteContactMutation.mutate({ contactId, customerId }),
      },
    ]);
  };

  // ---- Site handlers ----
  const handleAddSite = async () => {
    if (!customerId || !newSite.name.trim()) return;
    const result = await createSiteMutation.mutateAsync({
      customerId,
      payload: {
        name: newSite.name,
        ...(newSite.address && { address: newSite.address }),
        ...(newSite.city && { city: newSite.city }),
        ...(newSite.gps_coordinates && { gps_coordinates: newSite.gps_coordinates }),
        ...(newSite.landmarks && { landmarks: newSite.landmarks }),
      },
    });
    if (!result.error) {
      setNewSite({ name: '', address: '', city: '', gps_coordinates: '', landmarks: '' });
      setShowAddSite(false);
    } else {
      Alert.alert('Error', result.error.message);
    }
  };

  const handleStartEditSite = (site: CustomerSite) => {
    setEditingSiteId(site.id);
    setEditSite({
      name: site.name,
      address: site.address ?? '',
      city: site.city ?? '',
      gps_coordinates: site.gps_coordinates ?? '',
      landmarks: site.landmarks ?? '',
    });
  };

  const handleSaveEditSite = async () => {
    if (!editingSiteId || !customerId) return;
    const result = await updateSiteMutation.mutateAsync({
      siteId: editingSiteId,
      customerId,
      payload: {
        name: editSite.name,
        address: editSite.address || null,
        city: editSite.city || null,
        gps_coordinates: editSite.gps_coordinates || null,
        landmarks: editSite.landmarks || null,
      },
    });
    if (!result.error) {
      setEditingSiteId(null);
    } else {
      Alert.alert('Error', result.error.message);
    }
  };

  const handleDeleteSite = (siteId: string, name: string) => {
    if (!customerId) return;
    Alert.alert('Delete Site', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteSiteMutation.mutate({ siteId, customerId }),
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="chevron-left" size={28} color="#0a7ea4" />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>
          {customer.name}
        </ThemedText>
        <TouchableOpacity
          onPress={() => router.push(`/(app)/customers/form?id=${customerId}` as any)}
          style={styles.editButton}
          accessibilityLabel="Edit customer"
        >
          <MaterialIcons name="create" size={20} color="#0a7ea4" />
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <ThemedButton
          variant="destructive"
          size="sm"
          onPress={handleDeleteCustomer}
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? 'Deleting...' : 'Delete Customer'}
        </ThemedButton>
      </View>

      {/* Details Card */}
      <View style={styles.card}>
        <ThemedText type="subtitle" style={styles.cardTitle}>
          Details
        </ThemedText>
        <DetailRow
          label="Type"
          value={
            <View style={[styles.typeBadge, { backgroundColor: typeColors[customer.customer_type] }]}>
              <ThemedText style={styles.badgeText}>{customer.customer_type}</ThemedText>
            </View>
          }
        />
        <DetailRow
          label="Status"
          value={
            <View style={[styles.statusBadge, { backgroundColor: statusColors[customer.status] }]}>
              <ThemedText style={styles.badgeText}>{customer.status}</ThemedText>
            </View>
          }
        />
        <DetailRow label="Phone" value={customer.phone ?? '\u2014'} />
        <DetailRow label="Email" value={customer.email ?? '\u2014'} />
        <DetailRow label="Address" value={customer.address ?? '\u2014'} />
        <DetailRow label="Notes" value={customer.notes ?? '\u2014'} />
      </View>

      {/* Contacts Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <ThemedText type="subtitle" style={styles.cardTitle}>
            Contacts ({contacts.length})
          </ThemedText>
          <TouchableOpacity
            onPress={() => setShowAddContact(!showAddContact)}
            accessibilityLabel="Add contact"
          >
            <MaterialIcons name="add-circle" size={24} color="#0a7ea4" />
          </TouchableOpacity>
        </View>

        {showAddContact && (
          <View style={styles.addForm}>
            <ThemedInput
              label="Name *"
              value={newContact.name}
              onChangeText={(text) => setNewContact({ ...newContact, name: text })}
              placeholder="Contact name"
            />
            <ThemedInput
              label="Phone *"
              value={newContact.phone}
              onChangeText={(text) => setNewContact({ ...newContact, phone: text })}
              placeholder="+1 234 567 8900"
              keyboardType="phone-pad"
            />
            <ThemedInput
              label="Role"
              value={newContact.role}
              onChangeText={(text) => setNewContact({ ...newContact, role: text })}
              placeholder="e.g. Manager"
            />
            <ThemedInput
              label="Department"
              value={newContact.department}
              onChangeText={(text) => setNewContact({ ...newContact, department: text })}
              placeholder="e.g. Operations"
            />
            <ThemedInput
              label="Email"
              value={newContact.email}
              onChangeText={(text) => setNewContact({ ...newContact, email: text })}
              placeholder="email@example.com"
              keyboardType="email-address"
            />
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setNewContact({ ...newContact, is_primary: !newContact.is_primary })}
              accessibilityRole="switch"
              accessibilityState={{ checked: newContact.is_primary }}
            >
              <ThemedText>Primary Contact</ThemedText>
              <MaterialIcons
                name={newContact.is_primary ? 'check-box' : 'check-box-outline-blank'}
                size={24}
                color={newContact.is_primary ? '#0a7ea4' : '#9ca3af'}
              />
            </TouchableOpacity>
            <ThemedButton
              size="sm"
              onPress={handleAddContact}
              disabled={createContactMutation.isPending}
            >
              {createContactMutation.isPending ? 'Adding...' : 'Add'}
            </ThemedButton>
          </View>
        )}

        {contacts.length === 0 ? (
          <ThemedText style={styles.emptyText}>No contacts added</ThemedText>
        ) : (
          contacts.map((contact) =>
            editingContactId === contact.id ? (
              <View key={contact.id} style={styles.addForm}>
                <ThemedInput
                  label="Name"
                  value={editContact.name}
                  onChangeText={(text) => setEditContact({ ...editContact, name: text })}
                />
                <ThemedInput
                  label="Phone"
                  value={editContact.phone}
                  onChangeText={(text) => setEditContact({ ...editContact, phone: text })}
                  keyboardType="phone-pad"
                />
                <ThemedInput
                  label="Role"
                  value={editContact.role}
                  onChangeText={(text) => setEditContact({ ...editContact, role: text })}
                />
                <ThemedInput
                  label="Department"
                  value={editContact.department}
                  onChangeText={(text) => setEditContact({ ...editContact, department: text })}
                />
                <ThemedInput
                  label="Email"
                  value={editContact.email}
                  onChangeText={(text) => setEditContact({ ...editContact, email: text })}
                  keyboardType="email-address"
                />
                <TouchableOpacity
                  style={styles.toggleRow}
                  onPress={() =>
                    setEditContact({ ...editContact, is_primary: !editContact.is_primary })
                  }
                  accessibilityRole="switch"
                  accessibilityState={{ checked: editContact.is_primary }}
                >
                  <ThemedText>Primary Contact</ThemedText>
                  <MaterialIcons
                    name={editContact.is_primary ? 'check-box' : 'check-box-outline-blank'}
                    size={24}
                    color={editContact.is_primary ? '#0a7ea4' : '#9ca3af'}
                  />
                </TouchableOpacity>
                <View style={styles.editActions}>
                  <ThemedButton
                    size="sm"
                    onPress={handleSaveEditContact}
                    disabled={updateContactMutation.isPending}
                  >
                    {updateContactMutation.isPending ? 'Saving...' : 'Save'}
                  </ThemedButton>
                  <ThemedButton
                    size="sm"
                    variant="ghost"
                    onPress={() => setEditingContactId(null)}
                  >
                    Cancel
                  </ThemedButton>
                </View>
              </View>
            ) : (
              <ContactItem
                key={contact.id}
                contact={contact}
                onEdit={() => handleStartEditContact(contact)}
                onDelete={() => handleDeleteContact(contact.id, contact.name)}
              />
            )
          )
        )}
      </View>

      {/* Sites Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <ThemedText type="subtitle" style={styles.cardTitle}>
            Sites ({sites.length})
          </ThemedText>
          <TouchableOpacity
            onPress={() => setShowAddSite(!showAddSite)}
            accessibilityLabel="Add site"
          >
            <MaterialIcons name="add-circle" size={24} color="#0a7ea4" />
          </TouchableOpacity>
        </View>

        {showAddSite && (
          <View style={styles.addForm}>
            <ThemedInput
              label="Name *"
              value={newSite.name}
              onChangeText={(text) => setNewSite({ ...newSite, name: text })}
              placeholder="Site name"
            />
            <ThemedInput
              label="Address"
              value={newSite.address}
              onChangeText={(text) => setNewSite({ ...newSite, address: text })}
              placeholder="Full address"
            />
            <ThemedInput
              label="City"
              value={newSite.city}
              onChangeText={(text) => setNewSite({ ...newSite, city: text })}
              placeholder="City"
            />
            <ThemedInput
              label="GPS Coordinates"
              value={newSite.gps_coordinates}
              onChangeText={(text) => setNewSite({ ...newSite, gps_coordinates: text })}
              placeholder="e.g. 24.7136, 46.6753"
            />
            <ThemedInput
              label="Landmarks"
              value={newSite.landmarks}
              onChangeText={(text) => setNewSite({ ...newSite, landmarks: text })}
              placeholder="Nearby landmarks"
            />
            <ThemedButton
              size="sm"
              onPress={handleAddSite}
              disabled={createSiteMutation.isPending}
            >
              {createSiteMutation.isPending ? 'Adding...' : 'Add'}
            </ThemedButton>
          </View>
        )}

        {sites.length === 0 ? (
          <ThemedText style={styles.emptyText}>No sites added</ThemedText>
        ) : (
          sites.map((site) =>
            editingSiteId === site.id ? (
              <View key={site.id} style={styles.addForm}>
                <ThemedInput
                  label="Name"
                  value={editSite.name}
                  onChangeText={(text) => setEditSite({ ...editSite, name: text })}
                />
                <ThemedInput
                  label="Address"
                  value={editSite.address}
                  onChangeText={(text) => setEditSite({ ...editSite, address: text })}
                />
                <ThemedInput
                  label="City"
                  value={editSite.city}
                  onChangeText={(text) => setEditSite({ ...editSite, city: text })}
                />
                <ThemedInput
                  label="GPS Coordinates"
                  value={editSite.gps_coordinates}
                  onChangeText={(text) => setEditSite({ ...editSite, gps_coordinates: text })}
                />
                <ThemedInput
                  label="Landmarks"
                  value={editSite.landmarks}
                  onChangeText={(text) => setEditSite({ ...editSite, landmarks: text })}
                />
                <View style={styles.editActions}>
                  <ThemedButton
                    size="sm"
                    onPress={handleSaveEditSite}
                    disabled={updateSiteMutation.isPending}
                  >
                    {updateSiteMutation.isPending ? 'Saving...' : 'Save'}
                  </ThemedButton>
                  <ThemedButton
                    size="sm"
                    variant="ghost"
                    onPress={() => setEditingSiteId(null)}
                  >
                    Cancel
                  </ThemedButton>
                </View>
              </View>
            ) : (
              <SiteItem
                key={site.id}
                site={site}
                onEdit={() => handleStartEditSite(site)}
                onDelete={() => handleDeleteSite(site.id, site.name)}
              />
            )
          )
        )}
      </View>
    </ScrollView>
  );
}

// ---- Sub-components --------------------------------------------------------

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View style={styles.detailRow}>
      <ThemedText style={styles.detailLabel}>{label}</ThemedText>
      <View style={styles.detailValue}>
        {typeof value === 'string' ? <ThemedText>{value}</ThemedText> : value}
      </View>
    </View>
  );
}

function ContactItem({
  contact,
  onEdit,
  onDelete,
}: {
  contact: CustomerContact;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.listItem}>
      <View style={styles.listItemInfo}>
        <View style={styles.listItemHeader}>
          <ThemedText type="defaultSemiBold">{contact.name}</ThemedText>
          {contact.is_primary && (
            <MaterialIcons name="star" size={16} color="#f59e0b" />
          )}
        </View>
        {(contact.role || contact.department) && (
          <ThemedText style={styles.mutedText}>
            {[contact.role, contact.department].filter(Boolean).join(' \u00B7 ')}
          </ThemedText>
        )}
        <ThemedText style={styles.mutedText}>{contact.phone}</ThemedText>
        {contact.email && (
          <ThemedText style={styles.mutedText}>{contact.email}</ThemedText>
        )}
      </View>
      <View style={styles.listItemActions}>
        <TouchableOpacity onPress={onEdit} style={styles.iconButton} accessibilityLabel="Edit contact">
          <MaterialIcons name="create" size={18} color="#0a7ea4" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.iconButton} accessibilityLabel="Delete contact">
          <MaterialIcons name="delete" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SiteItem({
  site,
  onEdit,
  onDelete,
}: {
  site: CustomerSite;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.listItem}>
      <View style={styles.listItemInfo}>
        <ThemedText type="defaultSemiBold">{site.name}</ThemedText>
        {(site.address || site.city) && (
          <ThemedText style={styles.mutedText}>
            {[site.address, site.city].filter(Boolean).join(', ')}
          </ThemedText>
        )}
        {site.gps_coordinates && (
          <ThemedText style={styles.monoText}>{site.gps_coordinates}</ThemedText>
        )}
        {site.landmarks && (
          <ThemedText style={styles.mutedText}>{site.landmarks}</ThemedText>
        )}
      </View>
      <View style={styles.listItemActions}>
        <TouchableOpacity onPress={onEdit} style={styles.iconButton} accessibilityLabel="Edit site">
          <MaterialIcons name="create" size={18} color="#0a7ea4" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.iconButton} accessibilityLabel="Delete site">
          <MaterialIcons name="delete" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---- Styles ----------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 4,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  editButton: {
    padding: 4,
  },
  actions: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    marginBottom: 0,
  },
  detailRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: {
    color: '#6b7280',
    fontSize: 14,
  },
  detailValue: {
    alignItems: 'flex-end' as const,
    flexShrink: 1,
    maxWidth: '60%' as any,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  addForm: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 4,
  },
  toggleRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  editActions: {
    flexDirection: 'row' as const,
    gap: 8,
    marginTop: 8,
  },
  listItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  listItemInfo: {
    flex: 1,
    gap: 2,
  },
  listItemHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 6,
  },
  listItemActions: {
    flexDirection: 'row' as const,
    gap: 8,
    marginLeft: 12,
    paddingTop: 2,
  },
  iconButton: {
    padding: 4,
  },
  mutedText: {
    fontSize: 13,
    color: '#6b7280',
  },
  monoText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    paddingVertical: 16,
    fontStyle: 'italic',
  },
});
