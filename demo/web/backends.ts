export type Backend = {
  id: string
  label: string
  url: string
  logo: string
  controller: string
}

export const backends: Backend[] = [
  {
    id: 'express',
    label: 'Express',
    url: 'http://localhost:8787',
    logo: '/express.svg',
    controller: `// Express + @affordant/server + @affordant/express
app.get('/orders/:id', (req, res) => {
  const order = orders.get(req.params.id)
  sendResource(res, resource(order)
    .self(urlFor(req, \`/orders/\${order.id}\`))
    .action('track', urlFor(req, \`/orders/\${order.id}/tracking\`))
    .action('cancel', urlFor(req, \`/orders/\${order.id}/cancel\`), {
      method: 'POST',
      when: caller(req) === order.ownerId && order.status === 'pending',
    }))
})`,
  },
  {
    id: 'node',
    label: 'Node (100% JS)',
    url: 'http://localhost:8788',
    logo: '/node.svg',
    controller: `// Raw node:http + @affordant/server — 100% JS, no framework
if (req.method === 'GET' && path === \`/orders/\${id}\`) {
  const body = resource(order)
    .self(urlFor(req, \`/orders/\${order.id}\`))
    .action('track', urlFor(req, \`/orders/\${order.id}/tracking\`))
    .action('cancel', urlFor(req, \`/orders/\${order.id}/cancel\`), {
      method: 'POST',
      when: caller(req) === order.ownerId && order.status === 'pending',
    })
    .build()
  res.writeHead(200, { 'content-type': 'application/json' })
  res.end(JSON.stringify(body))
}`,
  },
]
