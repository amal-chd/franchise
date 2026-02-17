import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useToast } from '@/context/ToastContext';
import { useConfirmation } from '@/context/ConfirmationContext';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

export default function TrainingTab() {
    const { showToast } = useToast();
    const { confirm } = useConfirmation();

    const [trainingModules, setTrainingModules] = useState<any[]>([]);
    const [activeTrainingModule, setActiveTrainingModule] = useState<any | null>(null);
    const [trainingMaterials, setTrainingMaterials] = useState<any[]>([]);
    const [newTrainingModule, setNewTrainingModule] = useState({ title: '', description: '', role: 'franchise', thumbnail_url: '', category: 'General' });
    const [editingModule, setEditingModule] = useState<any | null>(null);
    const [newTrainingMaterial, setNewTrainingMaterial] = useState({ title: '', type: 'video', content_url: '', content_text: '', order_index: 0 });
    const [editingMaterial, setEditingMaterial] = useState<any | null>(null);
    const [trainingRoleFilter, setTrainingRoleFilter] = useState('all');

    const fetchTrainingModules = async () => {
        try {
            const res = await fetch('/api/admin/training/modules');
            const data = await res.json();
            setTrainingModules(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch training modules', error);
        }
    };

    const fetchTrainingMaterials = async (moduleId: number) => {
        try {
            const res = await fetch(`/api/admin/training/materials?moduleId=${moduleId}`);
            const data = await res.json();
            setTrainingMaterials(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch training materials', error);
        }
    };

    useEffect(() => {
        fetchTrainingModules();
    }, []);

    const handleCreateModule = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = '/api/admin/training/modules';
            const method = editingModule ? 'PUT' : 'POST';
            const body = editingModule ? { ...newTrainingModule, id: editingModule.id } : newTrainingModule;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                showToast(`Module ${editingModule ? 'updated' : 'created'} successfully`, 'success');
                setNewTrainingModule({ title: '', description: '', role: 'franchise', thumbnail_url: '', category: 'General' });
                setEditingModule(null);
                fetchTrainingModules();
            } else {
                showToast(`Failed to ${editingModule ? 'update' : 'create'} module`, 'error');
            }
        } catch (error) {
            console.error('Error saving module', error);
            showToast('Error saving module', 'error');
        }
    };

    const handleEditModule = (module: any) => {
        setEditingModule(module);
        setNewTrainingModule({
            title: module.title,
            description: module.description,
            role: module.role,
            thumbnail_url: module.thumbnail_url || '',
            category: module.category || 'General'
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteModule = async (id: number) => {
        const isConfirmed = await confirm({
            title: 'Delete Module',
            message: 'Are you sure? This will delete all materials in this module.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger'
        });

        if (isConfirmed) {
            try {
                const res = await fetch(`/api/admin/training/modules?id=${id}`, { method: 'DELETE' });
                if (res.ok) {
                    showToast('Module deleted successfully', 'success');
                    fetchTrainingModules();
                    if (activeTrainingModule?.id === id) setActiveTrainingModule(null);
                } else {
                    showToast('Failed to delete module', 'error');
                }
            } catch (error) {
                console.error('Error deleting module', error);
                showToast('Error deleting module', 'error');
            }
        }
    };

    const handleCreateMaterial = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeTrainingModule) return;
        try {
            const url = '/api/admin/training/materials';
            const method = editingMaterial ? 'PUT' : 'POST';
            const body = editingMaterial
                ? { ...newTrainingMaterial, id: editingMaterial.id, module_id: activeTrainingModule.id }
                : { ...newTrainingMaterial, module_id: activeTrainingModule.id };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                showToast(`Material ${editingMaterial ? 'updated' : 'added'} successfully`, 'success');
                setNewTrainingMaterial({ title: '', type: 'video', content_url: '', content_text: '', order_index: 0 });
                setEditingMaterial(null);
                fetchTrainingMaterials(activeTrainingModule.id);
            } else {
                showToast(`Failed to ${editingMaterial ? 'update' : 'add'} material`, 'error');
            }
        } catch (error) {
            console.error('Error saving material', error);
            showToast('Error saving material', 'error');
        }
    };

    const handleEditMaterial = (material: any) => {
        setEditingMaterial(material);
        setNewTrainingMaterial({
            title: material.title,
            type: material.type,
            content_url: material.content_url || '',
            content_text: material.content_text || '',
            order_index: material.order_index || 0
        });
    };

    const handleDeleteMaterial = async (id: number) => {
        const isConfirmed = await confirm({
            title: 'Delete Material',
            message: 'Are you sure you want to delete this material?',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger'
        });

        if (isConfirmed) {
            try {
                const res = await fetch(`/api/admin/training/materials?id=${id}`, { method: 'DELETE' });
                if (res.ok) {
                    showToast('Material deleted successfully', 'success');
                    if (activeTrainingModule) fetchTrainingMaterials(activeTrainingModule.id);
                } else {
                    showToast('Failed to delete material', 'error');
                }
            } catch (error) {
                console.error('Error deleting material', error);
                showToast('Error deleting material', 'error');
            }
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
            {/* Modules List */}
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0', height: 'fit-content' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0 }}>Training Modules</h3>
                    <select
                        value={trainingRoleFilter}
                        onChange={(e) => setTrainingRoleFilter(e.target.value)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #ddd',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            outline: 'none'
                        }}
                    >
                        <option value="all">All Roles</option>
                        <option value="franchise">Franchise</option>
                        <option value="delivery_partner">Delivery Partner</option>
                        <option value="vendor">Vendor</option>
                    </select>
                </div>

                <form onSubmit={handleCreateModule} style={{ marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ fontSize: '1rem', margin: 0 }}>{editingModule ? 'Edit Module' : 'Create New Module'}</h4>
                        {editingModule && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingModule(null);
                                    setNewTrainingModule({ title: '', description: '', role: 'franchise', thumbnail_url: '', category: 'General' });
                                }}
                                style={{ fontSize: '0.8rem', color: '#666', background: 'none', border: '1px solid #ddd', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                        <input
                            type="text"
                            placeholder="Module Title"
                            className="form-input"
                            value={newTrainingModule.title}
                            onChange={e => setNewTrainingModule({ ...newTrainingModule, title: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                        <select
                            className="form-input"
                            value={newTrainingModule.role}
                            onChange={e => setNewTrainingModule({ ...newTrainingModule, role: e.target.value })}
                        >
                            <option value="franchise">Franchise</option>
                            <option value="delivery_partner">Delivery Partner</option>
                            <option value="vendor">Vendor</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                        <textarea
                            placeholder="Description"
                            className="form-input"
                            style={{ height: '60px' }}
                            value={newTrainingModule.description}
                            onChange={e => setNewTrainingModule({ ...newTrainingModule, description: e.target.value })}
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                        <input
                            type="text"
                            placeholder="Category (e.g. Onboarding, Safety)"
                            className="form-input"
                            value={newTrainingModule.category}
                            onChange={e => setNewTrainingModule({ ...newTrainingModule, category: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '0.9rem', padding: '8px' }}>
                        {editingModule ? 'Update Module' : 'Create Module'}
                    </button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {['franchise', 'delivery_partner', 'vendor']
                        .filter(role => trainingRoleFilter === 'all' || trainingRoleFilter === role)
                        .map(role => {
                            const roleModules = trainingModules.filter(m => m.role === role);
                            if (roleModules.length === 0) return null;

                            return (
                                <div key={role}>
                                    <h4 style={{
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        color: '#1e293b',
                                        paddingBottom: '8px',
                                        borderBottom: '2px solid #e2e8f0',
                                        marginBottom: '16px',
                                        textTransform: 'capitalize'
                                    }}>
                                        {role.replace('_', ' ')} Modules
                                    </h4>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        {Object.entries(roleModules.reduce((acc: any, module) => {
                                            const cat = module.category || 'General';
                                            if (!acc[cat]) acc[cat] = [];
                                            acc[cat].push(module);
                                            return acc;
                                        }, {})).map(([category, modules]: [string, any]) => (
                                            <div key={category}>
                                                <h5 style={{
                                                    fontSize: '0.85rem',
                                                    textTransform: 'uppercase',
                                                    color: '#64748B',
                                                    fontWeight: 'bold',
                                                    marginBottom: '8px',
                                                    letterSpacing: '0.05em'
                                                }}>
                                                    {category}
                                                </h5>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {modules.map((module: any) => (
                                                        <div
                                                            key={module.id}
                                                            onClick={() => {
                                                                setActiveTrainingModule(module);
                                                                fetchTrainingMaterials(module.id);
                                                            }}
                                                            style={{
                                                                padding: '12px',
                                                                borderRadius: '8px',
                                                                border: activeTrainingModule?.id === module.id ? '2px solid var(--primary-color)' : '1px solid #e2e8f0',
                                                                background: activeTrainingModule?.id === module.id ? '#eff6ff' : 'white',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>{module.title}</h4>
                                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleEditModule(module); }}
                                                                        style={{ color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer' }}
                                                                    >
                                                                        <i className="fas fa-edit"></i>
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleDeleteModule(module.id); }}
                                                                        style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}
                                                                    >
                                                                        <i className="fas fa-trash"></i>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <span style={{
                                                                fontSize: '0.75rem',
                                                                padding: '2px 8px',
                                                                borderRadius: '12px',
                                                                background: '#e2e8f0',
                                                                color: '#475569',
                                                                textTransform: 'capitalize'
                                                            }}>
                                                                {module.role.replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>

            {/* Materials List */}
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid #dadce0' }}>
                {activeTrainingModule ? (
                    <>
                        <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #eee' }}>
                            <h3 style={{ marginBottom: '8px' }}>{activeTrainingModule.title} - Materials</h3>
                            <p style={{ color: '#64748B', margin: 0 }}>{activeTrainingModule.description}</p>
                        </div>

                        <form onSubmit={handleCreateMaterial} style={{ marginBottom: '24px', padding: '20px', background: '#f8fafc', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h4 style={{ fontSize: '1rem', margin: 0 }}>{editingMaterial ? 'Edit Material' : 'Add Material'}</h4>
                                {editingMaterial && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingMaterial(null);
                                            setNewTrainingMaterial({ title: '', type: 'video', content_url: '', content_text: '', order_index: 0 });
                                        }}
                                        style={{ fontSize: '0.8rem', color: '#666', background: 'none', border: '1px solid #ddd', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                                <input
                                    type="text"
                                    placeholder="Material Title"
                                    className="form-input"
                                    value={newTrainingMaterial.title}
                                    onChange={e => setNewTrainingMaterial({ ...newTrainingMaterial, title: e.target.value })}
                                    required
                                />
                                <select
                                    className="form-input"
                                    value={newTrainingMaterial.type}
                                    onChange={e => setNewTrainingMaterial({ ...newTrainingMaterial, type: e.target.value })}
                                >
                                    <option value="video">Video URL</option>
                                    <option value="pdf">PDF URL</option>
                                    <option value="image">Image URL</option>
                                    <option value="text">Text Content</option>
                                </select>
                            </div>

                            {newTrainingMaterial.type === 'text' ? (
                                <div style={{ marginBottom: '12px', background: 'white' }}>
                                    <ReactQuill
                                        theme="snow"
                                        value={newTrainingMaterial.content_text}
                                        onChange={(value: string) => setNewTrainingMaterial({ ...newTrainingMaterial, content_text: value })}
                                        style={{ height: '200px', marginBottom: '50px' }}
                                        modules={{
                                            toolbar: [
                                                [{ 'header': [1, 2, 3, false] }],
                                                ['bold', 'italic', 'underline', 'strike'],
                                                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                ['link', 'clean']
                                            ],
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="form-group" style={{ marginBottom: '12px' }}>
                                    <input
                                        type="text"
                                        placeholder={newTrainingMaterial.type === 'video' ? 'YouTube/Video URL' : 'File URL'}
                                        className="form-input"
                                        value={newTrainingMaterial.content_url}
                                        onChange={e => setNewTrainingMaterial({ ...newTrainingMaterial, content_url: e.target.value })}
                                    />
                                    {/* File Upload Helper */}
                                    {(newTrainingMaterial.type === 'pdf' || newTrainingMaterial.type === 'image') && (
                                        <div style={{ marginTop: '8px' }}>
                                            <input
                                                type="file"
                                                accept={newTrainingMaterial.type === 'pdf' ? '.pdf' : 'image/*'}
                                                onChange={async e => {
                                                    if (!e.target.files?.[0]) return;
                                                    const formData = new FormData();
                                                    formData.append('file', e.target.files[0]);
                                                    const res = await fetch('/api/admin/upload-background', {
                                                        method: 'POST',
                                                        body: formData,
                                                    });
                                                    const data = await res.json();
                                                    if (data.url) {
                                                        setNewTrainingMaterial({ ...newTrainingMaterial, content_url: data.url });
                                                    }
                                                }}
                                            />
                                            <span style={{ fontSize: '0.8rem', color: '#666', marginLeft: '8px' }}>Upload to generate URL</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button type="submit" className="btn btn-primary">
                                {editingMaterial ? 'Update Material' : 'Add Material'}
                            </button>
                        </form>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {trainingMaterials.map((material) => (
                                <div key={material.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{
                                                background: '#e0f2fe', color: '#0369a1',
                                                padding: '2px 8px', borderRadius: '4px',
                                                fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold'
                                            }}>
                                                {material.type}
                                            </span>
                                            <h4 style={{ margin: 0 }}>{material.title}</h4>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => handleEditMaterial(material)}
                                                style={{ color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer' }}
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteMaterial(material.id)}
                                                style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>

                                    {material.type === 'text' && (
                                        <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {material.content_text.replace(/<[^>]*>?/gm, '')}
                                        </p>
                                    )}
                                    {material.type !== 'text' && (
                                        <a href={material.content_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', fontSize: '0.85rem', textDecoration: 'underline' }}>
                                            View Content <i className="fas fa-external-link-alt" style={{ fontSize: '0.8rem' }}></i>
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                        {trainingMaterials.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center', fontStyle: 'italic' }}>No materials added yet.</p>}
                    </>
                ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                        <p>Select a module to view and manage materials</p>
                    </div>
                )}
            </div>
        </div>
    );
}
