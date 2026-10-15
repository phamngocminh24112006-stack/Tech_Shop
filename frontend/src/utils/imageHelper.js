export const getProductImage = (product) => {
    if (!product) return 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=80';
    
    if (product.image_url && (product.image_url.startsWith('http') || product.image_url.startsWith('https'))) {
        return product.image_url;
    }
    
    const cat = product.category?.toLowerCase() || '';
    const name = product.name?.toLowerCase() || '';
    
    if (name.includes('iphone') || name.includes('phone') || name.includes('s24') || name.includes('reno') || name.includes('tab s9') || cat === 'phone') {
        if (name.includes('16')) {
            return 'https://images.unsplash.com/photo-1727896434407-353fead70685?w=600&auto=format&fit=crop&q=80';
        }
        if (name.includes('s24') || name.includes('galaxy')) {
            return 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80';
        }
        return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80';
    }
    
    if (name.includes('macbook') || name.includes('laptop') || name.includes('tuf') || name.includes('xps') || name.includes('legion') || cat === 'laptop') {
        if (name.includes('tuf') || name.includes('gaming')) {
            return 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&auto=format&fit=crop&q=80';
        }
        if (name.includes('macbook')) {
            return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80';
        }
        return 'https://images.unsplash.com/photo-1496181130204-755241544e35?w=600&auto=format&fit=crop&q=80';
    }
    
    if (name.includes('rtx') || name.includes('radeon') || name.includes('vga') || cat === 'vga') {
        return 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&auto=format&fit=crop&q=80';
    }
    
    if (name.includes('pc') || cat === 'pc') {
        return 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80';
    }
    
    if (name.includes('ultragear') || name.includes('odyssey') || name.includes('monitor') || cat === 'monitor') {
        return 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80';
    }
    
    if (name.includes('laserjet') || name.includes('printer') || cat === 'printer') {
        return 'https://images.unsplash.com/photo-1612815154858-60aa4c59edd6?w=600&auto=format&fit=crop&q=80';
    }
    
    if (name.includes('i7') || name.includes('fury') || name.includes('990 pro') || name.includes('cpu') || name.includes('ssd') || name.includes('ram') || cat === 'cpu') {
        return 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&auto=format&fit=crop&q=80';
    }
    
    if (name.includes('airpods') || name.includes('jbl') || name.includes('headphone') || name.includes('mx master') || name.includes('mouse') || name.includes('accessory') || name.includes('bàn phím') || name.includes('chuột') || cat === 'phụ kiện') {
        if (name.includes('headphone') || name.includes('jbl') || name.includes('tune') || name.includes('airpods')) {
            return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80';
        }
        if (name.includes('mouse') || name.includes('mx master') || name.includes('chuột')) {
            return 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80';
        }
        return 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80';
    }
    
    return 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=80';
};
